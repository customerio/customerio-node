/**
 * Fixture replay.
 *
 * Loads every JSON fixture in test/fixtures/responses/ and replays it against
 * the SDK using nock as the HTTP transport. Snapshots the resolved value or
 * thrown-error shape. The same snapshots must hold when the underlying HTTP
 * stack changes (the fetch swap in PR 2).
 *
 * To regenerate snapshots after an intentional behavior change:
 *   npx ava test/fixtures/replay.ts --update-snapshots
 */
import * as fs from 'fs';
import * as path from 'path';
import test from 'ava';
import nock from 'nock';
import { TrackClient } from '../../lib/track';
import { APIClient } from '../../lib/api';
import { SendEmailRequest } from '../../lib/api/requests';
import { RegionUS } from '../../lib/regions';

type ResponseMock = {
  kind: 'response';
  host: string;
  path: string;
  method: string;
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
  rawBody?: string;
  delayMs?: number;
};

type ErrorMock = {
  kind: 'error';
  host: string;
  path: string;
  method: string;
  error: { code: string; message: string };
};

type Mock = ResponseMock | ErrorMock;

type Fixture = {
  scenario: string;
  kind: 'live' | 'synthesized';
  note?: string;
  clientOptions?: { timeout?: number };
  sdkCall: { client: 'TrackClient' | 'APIClient'; method: string; args: unknown[] };
  mocks: Mock[];
  expect: 'resolve' | 'reject';
};

const FIXTURE_DIR = path.join(__dirname, 'responses');

const isFixture = (value: unknown): value is Fixture => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.scenario === 'string' &&
    (v.kind === 'live' || v.kind === 'synthesized') &&
    typeof v.sdkCall === 'object' &&
    Array.isArray(v.mocks) &&
    (v.expect === 'resolve' || v.expect === 'reject')
  );
};

const loadFixtures = (): Fixture[] => {
  if (!fs.existsSync(FIXTURE_DIR)) return [];
  const files = fs.readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json'));
  const fixtures: Fixture[] = [];
  for (const file of files) {
    const full = path.join(FIXTURE_DIR, file);
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(full, 'utf-8'));
    } catch (err) {
      console.warn(`replay: skipping ${file} (invalid JSON)`);
      continue;
    }
    if (!isFixture(parsed)) {
      console.warn(`replay: skipping ${file} (missing required fields)`);
      continue;
    }
    fixtures.push(parsed);
  }
  fixtures.sort((a, b) => a.scenario.localeCompare(b.scenario));
  return fixtures;
};

const applyMock = (mock: Mock): void => {
  const scope = nock(`https://${mock.host}`);
  const method = mock.method.toLowerCase() as 'get' | 'put' | 'post' | 'delete';
  // Match request body shape loosely — many SDK methods send `{}` defaults
  // that we don't pin in fixtures.
  let interceptor: nock.Interceptor;
  switch (method) {
    case 'get':
      interceptor = scope.get(mock.path);
      break;
    case 'put':
      interceptor = scope.put(mock.path, () => true);
      break;
    case 'post':
      interceptor = scope.post(mock.path, () => true);
      break;
    case 'delete':
      interceptor = scope.delete(mock.path);
      break;
    default:
      throw new Error(`replay: unsupported method ${mock.method}`);
  }

  if (mock.kind === 'error') {
    const err = Object.assign(new Error(mock.error.message), { code: mock.error.code });
    interceptor.replyWithError(err);
    return;
  }

  if (mock.delayMs) {
    interceptor = interceptor.delay(mock.delayMs);
  }

  const headers = mock.headers ?? {};
  // Prefer rawBody (a literal string) over body (object) when present, so
  // synthesized fixtures can express malformed-JSON and empty-body responses
  // verbatim.
  if (typeof mock.rawBody === 'string') {
    interceptor.reply(mock.status, mock.rawBody, headers);
  } else if (mock.body === undefined || mock.body === '') {
    interceptor.reply(mock.status, '', headers);
  } else {
    interceptor.reply(mock.status, mock.body as nock.Body, headers);
  }
};

const invokeSdk = async (fixture: Fixture): Promise<unknown> => {
  const { client, method, args } = fixture.sdkCall;
  const opts = { region: RegionUS, ...(fixture.clientOptions ?? {}) };

  if (client === 'TrackClient') {
    const trackClient = new TrackClient('site-id-placeholder', 'api-key-placeholder', opts);
    const fn = (trackClient as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[method];
    if (typeof fn !== 'function') {
      throw new Error(`replay: TrackClient has no method ${method}`);
    }
    return fn.apply(trackClient, args);
  }

  const apiClient = new APIClient('app-key-placeholder', opts);
  if (method === 'sendEmail') {
    const req = new SendEmailRequest(args[0] as ConstructorParameters<typeof SendEmailRequest>[0]);
    return apiClient.sendEmail(req);
  }
  const fn = (apiClient as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[method];
  if (typeof fn !== 'function') {
    throw new Error(`replay: APIClient has no method ${method}`);
  }
  return fn.apply(apiClient, args);
};

const captureError = (err: unknown): Record<string, unknown> => {
  if (!(err instanceof Error)) {
    return { value: String(err) };
  }
  const out: Record<string, unknown> = {
    name: err.name,
    message: err.message,
  };
  const anyErr = err as unknown as Record<string, unknown>;
  if (typeof anyErr.statusCode === 'number') out.statusCode = anyErr.statusCode;
  if (typeof anyErr.body === 'string') out.body = anyErr.body;
  if (typeof anyErr.code === 'string') out.code = anyErr.code;
  return out;
};

test.before(() => {
  nock.disableNetConnect();
});

test.beforeEach(() => {
  nock.cleanAll();
});

test.after.always(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

const fixtures = loadFixtures();

if (fixtures.length === 0) {
  test('replay: no fixtures found', (t) => {
    t.fail(`expected at least one fixture in ${FIXTURE_DIR}`);
  });
} else {
  for (const fixture of fixtures) {
    test.serial(`replay: ${fixture.scenario}`, async (t) => {
      for (const mock of fixture.mocks) {
        applyMock(mock);
      }

      try {
        const result = await invokeSdk(fixture);
        if (fixture.expect === 'reject') {
          t.fail(`expected ${fixture.scenario} to reject but it resolved with: ${JSON.stringify(result)}`);
          return;
        }
        t.snapshot({ outcome: 'resolve', value: result }, fixture.scenario);
      } catch (err) {
        if (fixture.expect === 'resolve') {
          t.fail(`expected ${fixture.scenario} to resolve but it threw: ${(err as Error).message}`);
          return;
        }
        t.snapshot({ outcome: 'reject', error: captureError(err) }, fixture.scenario);
      }

      // No pending nock interceptors should remain; if there are, the SDK
      // didn't make all the calls the fixture set up.
      t.true(nock.isDone(), `pending nock interceptors for ${fixture.scenario}: ${nock.pendingMocks().join(', ')}`);
    });
  }
}
