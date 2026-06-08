/**
 * Live dogfood suite for the v5.0.0 additions.
 *
 * Covers the surface that ships new in 5.0.0 and is otherwise only unit-tested
 * with stubs: the `PipelinesClient` and the `ResponseLike` error shape from the
 * native-fetch request layer. Run it against a real workspace before cutting a
 * release. NOT gated in CI; it is excluded from `npm test` like the rest of
 * `test/integration/`.
 *
 * Required env vars to run anything:
 *   CIO_LIVE=1
 *
 * Pipelines tests (each skipped unless the write key is present):
 *   CIO_PIPELINES_WRITE_KEY   Data Pipelines source write key
 *                             (dashboard: Data Pipelines -> Sources)
 *
 * Optional:
 *   CIO_REGION                "us" | "eu" (default "us")
 *
 * Profile lifecycle: one throwaway userId per run, id = `sdk-live-v5-${uuid}`.
 * The Pipelines API is fire-and-forget ingestion, so there is nothing to clean
 * up server-side; events land on a throwaway profile in the test workspace.
 */
import test from 'ava';
import { randomUUID } from 'crypto';
import { PipelinesClient } from '../../lib/pipelines';
import { APIClient } from '../../lib/api';
import { RegionUS, RegionEU } from '../../lib/regions';
import { CustomerIORequestError } from '../../lib/utils';
import type { BatchItem } from '../../lib/pipelines/payloads';

const isLive = process.env.CIO_LIVE === '1';
const region = process.env.CIO_REGION === 'eu' ? RegionEU : RegionUS;
const writeKey = process.env.CIO_PIPELINES_WRITE_KEY ?? '';

const userId = `sdk-live-v5-${randomUUID()}`;
const anonymousId = `sdk-live-v5-anon-${randomUUID()}`;
const previousId = `sdk-live-v5-prev-${randomUUID()}`;
const groupId = `sdk-live-v5-group-${randomUUID()}`;

// strictMode asks the Pipelines API to validate payloads and return real HTTP
// error codes instead of silently accepting malformed events, so a green run
// here means the server actually accepted what we sent.
const pipelines = isLive && writeKey ? new PipelinesClient(writeKey, { region, strictMode: true }) : null;

const liveTest = isLive ? test.serial : test.serial.skip;
const pipelinesTest = isLive && writeKey ? test.serial : test.serial.skip;

if (!isLive) {
  test('v5 live suite skipped (set CIO_LIVE=1 to run)', (t) => t.pass());
} else if (!writeKey) {
  test('pipelines tests skipped (set CIO_PIPELINES_WRITE_KEY to run them)', (t) => t.pass());
}

// -----------------------------------------------------------------------------
// 1. PipelinesClient — full method surface, strict mode on.
//    Each call resolves only when the API returns a 2xx; under strict mode a
//    malformed payload would reject, so resolution is a real acceptance signal.
// -----------------------------------------------------------------------------

pipelinesTest('identify accepts a server-side profile', async (t) => {
  await pipelines!.identify({
    userId,
    traits: { email: `${userId}@example.com`, plan: 'sdk-live-v5', created_at: Math.floor(Date.now() / 1000) },
  });
  t.pass();
});

pipelinesTest('identify accepts an anonymous-only profile', async (t) => {
  await pipelines!.identify({ anonymousId });
  t.pass();
});

pipelinesTest('track records an event', async (t) => {
  await pipelines!.track({ userId, event: 'sdk_live_v5_event', properties: { run: userId } });
  t.pass();
});

pipelinesTest('page records a page view', async (t) => {
  await pipelines!.page({ userId, name: 'SDK Live', properties: { path: '/sdk-live-v5' } });
  t.pass();
});

pipelinesTest('screen records a screen view', async (t) => {
  await pipelines!.screen({ userId, name: 'SDK Live Screen' });
  t.pass();
});

pipelinesTest('group associates the profile with a group', async (t) => {
  await pipelines!.group({ userId, groupId, traits: { plan: 'sdk-live-v5' } });
  t.pass();
});

pipelinesTest('alias links a previous id to the user', async (t) => {
  await pipelines!.alias({ userId, previousId });
  t.pass();
});

pipelinesTest('batch accepts a mixed batch in one request', async (t) => {
  const items: BatchItem[] = [
    { type: 'identify', userId, traits: { batched_at: new Date().toISOString() } },
    { type: 'track', userId, event: 'sdk_live_v5_batch_event' },
    { type: 'page', userId, name: 'SDK Live Batch' },
  ];
  await pipelines!.batch(items);
  t.pass();
});

pipelinesTest('a write key is rejected with a real HTTP error under strict mode', async (t) => {
  // A syntactically valid write key that is not provisioned should surface as a
  // CustomerIORequestError (not a silent accept) when strict mode is on. This
  // also exercises the v5 fetch error path end-to-end against the live host.
  const bogus = new PipelinesClient('wk-not-a-real-key-000000000000', { region, strictMode: true });
  const err = await t.throwsAsync(() => bogus.track({ userId, event: 'should_fail' }));
  t.true(err instanceof CustomerIORequestError, 'rejection is a CustomerIORequestError');
  const cioErr = err as CustomerIORequestError;
  t.true(cioErr.statusCode >= 400 && cioErr.statusCode < 500, `got a 4xx, was ${cioErr.statusCode}`);
});

// -----------------------------------------------------------------------------
// 2. v5 error shape — CustomerIORequestError.response is now a portable
//    `ResponseLike` ({ statusCode, headers, ok }) with lowercased header keys,
//    not an http.IncomingMessage. This is the documented TypeScript break, so
//    we assert the real wire response against the live App API.
// -----------------------------------------------------------------------------

liveTest('App API 401 surfaces the v5 ResponseLike error shape', async (t) => {
  const api = new APIClient('definitely-not-a-valid-app-key', { region });
  const err = await t.throwsAsync(() => api.getCustomersByEmail('nobody@example.com'));
  t.true(err instanceof CustomerIORequestError, 'rejection is a CustomerIORequestError');

  const cioErr = err as CustomerIORequestError;
  t.is(cioErr.statusCode, 401, 'bad bearer token returns 401');

  const response = cioErr.response as { statusCode: number; ok: boolean; headers: Record<string, string> };
  t.is(response.statusCode, 401, 'response.statusCode mirrors the status');
  t.false(response.ok, 'response.ok is false for a 4xx');
  t.is(typeof response.headers, 'object', 'response.headers is a plain object');

  // Header keys are lowercased by the fetch layer (vs the legacy rawHeaders).
  const headerKeys = Object.keys(response.headers);
  for (const key of headerKeys) {
    t.is(key, key.toLowerCase(), `header "${key}" is lowercased`);
  }
});

liveTest('a non-retryable 401 returns promptly without burning retry backoff', async (t) => {
  // 401 is not in the retryable set, so the call must return on the first
  // attempt. The default policy would otherwise add seconds of backoff; a tight
  // ceiling here catches a regression that wrongly retries 4xx.
  const api = new APIClient('definitely-not-a-valid-app-key', { region });
  const started = Date.now();
  await t.throwsAsync(() => api.getCustomersByEmail('nobody@example.com'));
  const elapsedMs = Date.now() - started;
  t.true(elapsedMs < 8_000, `single attempt should be fast, took ${elapsedMs}ms`);
});
