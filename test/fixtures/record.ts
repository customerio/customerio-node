/**
 * Fixture recorder.
 *
 * One-time tool. Hits a real Customer.io workspace and dumps wire-level
 * fixtures into test/fixtures/responses/. The replay test (replay.ts) consumes
 * these to verify that any underlying HTTP-stack change produces an identical
 * resolved-value or thrown-error shape.
 *
 * Usage:
 *   CIO_RECORD=1 \
 *   CIO_SITE_ID=... \
 *   CIO_API_KEY=... \
 *   CIO_APP_KEY=... \
 *   CIO_TX_MSG_ID=...        (optional, enables sendEmail)
 *   CIO_KNOWN_EMAIL=...      (optional, enables getCustomersByEmail__found)
 *   CIO_KNOWN_ID=...         (optional, enables getAttributes__success)
 *   npm run test:record
 *
 * Fixture schema (see test/fixtures/replay.ts for the consumer):
 *   {
 *     scenario: string,
 *     kind: 'live' | 'synthesized',
 *     sdkCall: { client, method, args },
 *     mocks: Array<{
 *       kind: 'response',
 *       host: string,
 *       path: string,
 *       method: string,
 *       status: number,
 *       headers?: Record<string, string>,
 *       body?: any,
 *     } | {
 *       kind: 'error',
 *       host: string,
 *       path: string,
 *       method: string,
 *       error: { code: string, message: string }
 *     }>,
 *     expect: 'resolve' | 'reject'
 *   }
 */
import * as fs from 'fs';
import * as path from 'path';
import nock from 'nock';
import { v4 as uuidv4 } from 'uuid';
import { TrackClient } from '../../lib/track';
import { APIClient } from '../../lib/api';
import { SendEmailRequest } from '../../lib/api/requests';
import { RegionUS } from '../../lib/regions';

if (process.env.CIO_RECORD !== '1') {
  console.log('Recorder is opt-in. Set CIO_RECORD=1 plus credential env vars to record.');
  console.log('See test/fixtures/record.ts for full usage.');
  process.exit(0);
}

const { CIO_SITE_ID, CIO_API_KEY, CIO_APP_KEY, CIO_TX_MSG_ID, CIO_KNOWN_EMAIL, CIO_KNOWN_ID } = process.env;

if (!CIO_SITE_ID || !CIO_API_KEY || !CIO_APP_KEY) {
  console.error('Missing credentials. CIO_SITE_ID, CIO_API_KEY, CIO_APP_KEY are required.');
  process.exit(1);
}

const FIXTURE_DIR = path.join(__dirname, 'responses');
fs.mkdirSync(FIXTURE_DIR, { recursive: true });

const track = new TrackClient(CIO_SITE_ID, CIO_API_KEY, { region: RegionUS });
const api = new APIClient(CIO_APP_KEY, { region: RegionUS });

type SdkCall = { client: 'TrackClient' | 'APIClient'; method: string; args: any[] };
type Mock =
  | {
      kind: 'response';
      host: string;
      path: string;
      method: string;
      status: number;
      headers?: Record<string, string>;
      body?: any;
    }
  | { kind: 'error'; host: string; path: string; method: string; error: { code: string; message: string } };
type Fixture = {
  scenario: string;
  kind: 'live' | 'synthesized';
  sdkCall: SdkCall;
  mocks: Mock[];
  expect: 'resolve' | 'reject';
};

const parseRawHeaders = (raw: string[] | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (let i = 0; i < raw.length; i += 2) {
    const key = String(raw[i] ?? '').toLowerCase();
    if (key === 'authorization' || key === 'set-cookie' || key === 'cookie') continue;
    out[key] = String(raw[i + 1] ?? '');
  }
  return out;
};

const scopeToHost = (scope: string): string => {
  // "https://track.customer.io:443" -> "track.customer.io"
  return scope.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
};

const writeFixture = (fixture: Fixture) => {
  const file = path.join(FIXTURE_DIR, `${fixture.scenario}.json`);
  fs.writeFileSync(file, JSON.stringify(fixture, null, 2) + '\n');
};

let captured = 0;
let failed = 0;

const recordOne = async (
  scenario: string,
  sdkCall: SdkCall,
  invoke: () => Promise<unknown>,
  expectedOutcome: 'resolve' | 'reject' = 'resolve',
): Promise<void> => {
  nock.recorder.clear();
  nock.recorder.rec({ output_objects: true, dont_print: true });
  let outcome: 'resolve' | 'reject' = 'resolve';
  try {
    await invoke();
  } catch (err) {
    outcome = 'reject';
  }
  const recorded = (nock.recorder.play() as any[]) ?? [];
  nock.recorder.clear();
  nock.restore();
  nock.recorder.rec({ output_objects: true, dont_print: true }); // resume for next call

  if (recorded.length === 0) {
    console.warn(`  no HTTP traffic captured for ${scenario}; skipped`);
    failed++;
    return;
  }

  const mocks: Mock[] = recorded.map((r) => ({
    kind: 'response' as const,
    host: scopeToHost(r.scope),
    path: r.path,
    method: r.method,
    status: r.status,
    headers: parseRawHeaders(r.rawHeaders),
    body: r.response === '' ? '' : r.response,
  }));

  writeFixture({ scenario, kind: 'live', sdkCall, mocks, expect: outcome });
  console.log(`  recorded ${scenario} (${outcome}, ${mocks.length} interaction${mocks.length === 1 ? '' : 's'})`);
  captured++;
};

const run = async () => {
  nock.recorder.rec({ output_objects: true, dont_print: true });

  const runId = uuidv4();
  const testId = `sdk-record-${runId}`;
  const anonId = `sdk-record-anon-${runId}`;
  const deviceId = 'recorded-device';
  const testEmail = `sdk-record-${runId}@example.com`;

  console.log(`recording fixtures (run id: ${runId})`);

  // Order matters: create, mutate, send, then destructive cleanup.
  await recordOne(
    'identify__success',
    { client: 'TrackClient', method: 'identify', args: [testId, { email: testEmail }] },
    () => track.identify(testId, { email: testEmail }),
  );

  await recordOne(
    'track__success',
    { client: 'TrackClient', method: 'track', args: [testId, { name: 'recorded_event' }] },
    () => track.track(testId, { name: 'recorded_event' }),
  );

  await recordOne(
    'trackAnonymous__success',
    { client: 'TrackClient', method: 'trackAnonymous', args: [anonId, { name: 'recorded_anon' }] },
    () => track.trackAnonymous(anonId, { name: 'recorded_anon' }),
  );

  await recordOne(
    'trackPageView__success',
    { client: 'TrackClient', method: 'trackPageView', args: [testId, '/recorded'] },
    () => track.trackPageView(testId, '/recorded'),
  );

  await recordOne(
    'addDevice__success',
    { client: 'TrackClient', method: 'addDevice', args: [testId, deviceId, 'ios'] },
    () => track.addDevice(testId, deviceId, 'ios'),
  );

  await recordOne(
    'batch__success',
    {
      client: 'TrackClient',
      method: 'batch',
      args: [[{ type: 'person', action: 'identify', identifiers: { id: testId }, attributes: {} }]],
    },
    () => track.batch([{ type: 'person', action: 'identify', identifiers: { id: testId }, attributes: {} }]),
  );

  await recordOne(
    'getCustomersByEmail__not_found',
    { client: 'APIClient', method: 'getCustomersByEmail', args: [`absent-${runId}@example.com`] },
    () => api.getCustomersByEmail(`absent-${runId}@example.com`),
  );

  if (CIO_KNOWN_EMAIL) {
    await recordOne(
      'getCustomersByEmail__found',
      { client: 'APIClient', method: 'getCustomersByEmail', args: [CIO_KNOWN_EMAIL] },
      () => api.getCustomersByEmail(CIO_KNOWN_EMAIL),
    );
  }

  if (CIO_KNOWN_ID) {
    await recordOne(
      'getAttributes__success',
      { client: 'APIClient', method: 'getAttributes', args: [CIO_KNOWN_ID] },
      () => api.getAttributes(CIO_KNOWN_ID),
    );
  }

  await recordOne('listExports__success', { client: 'APIClient', method: 'listExports', args: [] }, () =>
    api.listExports(),
  );

  if (CIO_TX_MSG_ID) {
    await recordOne(
      'sendEmail__success',
      {
        client: 'APIClient',
        method: 'sendEmail',
        args: [{ to: testEmail, identifiers: { id: testId }, transactional_message_id: CIO_TX_MSG_ID }],
      },
      () =>
        api.sendEmail(
          new SendEmailRequest({
            to: testEmail,
            identifiers: { id: testId },
            transactional_message_id: CIO_TX_MSG_ID,
          }),
        ),
    );
  }

  // 4xx capture — empty id rejects client-side before reaching the wire on
  // most SDK methods. Use getCustomersByEmail with a malformed value the server
  // will reject.
  await recordOne(
    'getCustomersByEmail__400',
    { client: 'APIClient', method: 'getCustomersByEmail', args: ['not a valid email at all'] },
    () => api.getCustomersByEmail('not a valid email at all'),
    'reject',
  );

  // Cleanup pass.
  await recordOne('suppress__success', { client: 'TrackClient', method: 'suppress', args: [testId] }, () =>
    track.suppress(testId),
  );

  await recordOne('unsuppress__success', { client: 'TrackClient', method: 'unsuppress', args: [testId] }, () =>
    track.unsuppress(testId),
  );

  await recordOne(
    'deleteDevice__success',
    { client: 'TrackClient', method: 'deleteDevice', args: [testId, deviceId] },
    () => track.deleteDevice(testId, deviceId),
  );

  await recordOne('destroy__success', { client: 'TrackClient', method: 'destroy', args: [testId] }, () =>
    track.destroy(testId),
  );

  nock.recorder.clear();

  console.log(`\nlive fixtures: ${captured} captured, ${failed} skipped`);
  console.log(`fixture dir:   ${FIXTURE_DIR}`);
  console.log('\nNote: synthesized fixtures (redirects, network errors, malformed JSON, empty body)');
  console.log('are committed separately and do not require recording.');
};

run().catch((err) => {
  console.error('recorder failed:', err);
  process.exit(1);
});
