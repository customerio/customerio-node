import type { TestFn } from 'ava';
import avaTest from 'ava';
import type { SinonStub } from 'sinon';
import sinon from 'sinon';
import { CustomerIO } from '../lib/customerio';
import {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendWhatsAppRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from '../lib/api/requests';
import { RegionUS, RegionEU } from '../lib/regions';
import { CustomerIORequestError, KeyCapabilityError, MissingParamError } from '../lib/utils';

type TestContext = { fetchStub: SinonStub };

// Every test stubs the global fetch, so they must not run concurrently.
const test = (avaTest as TestFn<TestContext>).serial;

const usKey = 'ak_us_0123456789ABCDEFGHIJKLMNOPQRSTUV_000000';
const euKey = 'ak_eu_0123456789ABCDEFGHIJKLMNOPQRSTUV_000000';
const publicKey = 'wk_us_0123456789ABCDEFGHIJKLMNOPQRSTUV_000000';
const legacyKey = 'abc123';

const respond = (fetchStub: SinonStub, status: number, body: Record<string, any> = {}) => {
  fetchStub.callsFake(async () => ({
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    text: async () => JSON.stringify(body),
  }));
};

const lastCall = (fetchStub: SinonStub) => {
  const [uri, init] = fetchStub.lastCall.args as [string, RequestInit & { headers: Record<string, string> }];
  return { uri, init };
};

const emailOptions = { to: 'a@example.com', identifiers: { id: 'user_123' }, transactional_message_id: 5 };

test.beforeEach((t) => {
  t.context.fetchStub = sinon.stub(global, 'fetch');
  respond(t.context.fetchStub, 200);
});

test.afterEach.always((t) => {
  t.context.fetchStub.restore();
});

test('constructor requires apiKey', (t) => {
  t.throws(() => new CustomerIO({ apiKey: '' }), { message: 'apiKey is required' });
  t.throws(() => new CustomerIO(undefined as any), { message: 'apiKey is required' });
});

test('constructor rejects an invalid region', (t) => {
  t.throws(() => new CustomerIO({ apiKey: usKey, region: 'eu' as any }), {
    message: 'region must be one of Regions.US or Regions.EU',
  });
});

test('region comes from the key', (t) => {
  t.is(new CustomerIO({ apiKey: usKey }).region, RegionUS);
  t.is(new CustomerIO({ apiKey: euKey }).region, RegionEU);
  t.is(new CustomerIO({ apiKey: publicKey }).region, RegionUS);
});

test('explicit region wins over the key', (t) => {
  t.is(new CustomerIO({ apiKey: euKey, region: RegionUS }).region, RegionUS);
});

test('legacy keys keep the region option and US default', (t) => {
  t.is(new CustomerIO({ apiKey: legacyKey }).region, RegionUS);
  t.is(new CustomerIO({ apiKey: legacyKey, region: RegionEU }).region, RegionEU);
});

test('identify and track go to the Track API with Bearer', async (t) => {
  const cio = new CustomerIO({ apiKey: usKey });

  await cio.identify('user_123', { email: 'a@example.com' });
  let { uri, init } = lastCall(t.context.fetchStub);
  t.is(uri, `${RegionUS.trackUrl}/customers/user_123`);
  t.is(init.method, 'PUT');
  t.is(init.headers.Authorization, `Bearer ${usKey}`);

  await cio.track('user_123', { name: 'order_completed' });
  ({ uri, init } = lastCall(t.context.fetchStub));
  t.is(uri, `${RegionUS.trackUrl}/customers/user_123/events`);
  t.is(init.headers.Authorization, `Bearer ${usKey}`);
});

test('trackAnonymous and trackPageView go to the Track API', async (t) => {
  const cio = new CustomerIO({ apiKey: usKey });

  await cio.trackAnonymous('anon_1', { name: 'viewed' });
  t.is(lastCall(t.context.fetchStub).uri, `${RegionUS.trackUrl}/events`);

  await cio.trackPageView('user_123', '/pricing');
  t.is(lastCall(t.context.fetchStub).uri, `${RegionUS.trackUrl}/customers/user_123/events`);
});

test('ak_eu_ key sends to EU hosts', async (t) => {
  const cio = new CustomerIO({ apiKey: euKey });

  await cio.identify('user_123', {});
  t.is(lastCall(t.context.fetchStub).uri, `${RegionEU.trackUrl}/customers/user_123`);

  await cio.sendEmail(emailOptions);
  t.is(lastCall(t.context.fetchStub).uri, `${RegionEU.apiUrl}/send/email`);
});

test('custom URLs override the region hosts', async (t) => {
  const cio = new CustomerIO({ apiKey: usKey, trackUrl: 'http://track.test', apiUrl: 'http://api.test' });

  await cio.identify('1', {});
  t.is(lastCall(t.context.fetchStub).uri, 'http://track.test/customers/1');

  await cio.sendEmail(emailOptions);
  t.is(lastCall(t.context.fetchStub).uri, 'http://api.test/send/email');
});

test('request defaults reach both transports', async (t) => {
  const cio = new CustomerIO({ apiKey: usKey, headers: { 'X-Test': '1' } });

  await cio.identify('1', {});
  t.is(lastCall(t.context.fetchStub).init.headers['X-Test'], '1');

  await cio.sendEmail(emailOptions);
  t.is(lastCall(t.context.fetchStub).init.headers['X-Test'], '1');
});

test('sendEmail accepts options or a SendEmailRequest', async (t) => {
  const cio = new CustomerIO({ apiKey: usKey });

  await cio.sendEmail(emailOptions);
  let { uri, init } = lastCall(t.context.fetchStub);
  t.is(uri, `${RegionUS.apiUrl}/send/email`);
  t.is(init.headers.Authorization, `Bearer ${usKey}`);
  t.like(JSON.parse(init.body as string), emailOptions);

  const req = new SendEmailRequest(emailOptions);
  await cio.sendEmail(req);
  ({ init } = lastCall(t.context.fetchStub));
  t.deepEqual(JSON.parse(init.body as string), req.message);
});

test('other send methods go to the App API', async (t) => {
  const cio = new CustomerIO({ apiKey: usKey });
  const identifiers = { id: 'user_123' };

  const sends: Array<[() => Promise<unknown>, () => Promise<unknown>, string]> = [
    [
      () => cio.sendPush({ identifiers, transactional_message_id: 1 }),
      () => cio.sendPush(new SendPushRequest({ identifiers, transactional_message_id: 1 })),
      'push',
    ],
    [
      () => cio.sendSMS({ identifiers, transactional_message_id: 1 }),
      () => cio.sendSMS(new SendSMSRequest({ identifiers, transactional_message_id: 1 })),
      'sms',
    ],
    [
      () => cio.sendWhatsApp({ identifiers, transactional_message_id: 1 }),
      () => cio.sendWhatsApp(new SendWhatsAppRequest({ identifiers, transactional_message_id: 1 })),
      'whatsapp',
    ],
    [
      () => cio.sendInboxMessage({ identifiers, transactional_message_id: 1 }),
      () => cio.sendInboxMessage(new SendInboxMessageRequest({ identifiers, transactional_message_id: 1 })),
      'inbox_message',
    ],
    [
      () => cio.sendInApp({ identifiers, transactional_message_id: 1 }),
      () => cio.sendInApp(new SendInAppRequest({ identifiers, transactional_message_id: 1 })),
      'in_app',
    ],
  ];

  for (const [withOptions, withRequest, path] of sends) {
    await withOptions();
    t.is(lastCall(t.context.fetchStub).uri, `${RegionUS.apiUrl}/send/${path}`);
    await withRequest();
    t.is(lastCall(t.context.fetchStub).uri, `${RegionUS.apiUrl}/send/${path}`);
  }
});

test('wk_ key throws KeyCapabilityError on transactional calls without a request', (t) => {
  const cio = new CustomerIO({ apiKey: publicKey });

  const error = t.throws(() => cio.sendEmail(emailOptions), { instanceOf: KeyCapabilityError });
  t.is(error?.capability, 'transactional');
  t.regex(error!.message, /public keys \(wk_\) are for tracking only/);
  t.throws(() => cio.apiClient, { instanceOf: KeyCapabilityError });
  t.true(t.context.fetchStub.notCalled);
});

test('wk_ key can still track', async (t) => {
  const cio = new CustomerIO({ apiKey: publicKey });

  await cio.track('user_123', { name: 'viewed' });
  t.is(lastCall(t.context.fetchStub).init.headers.Authorization, `Bearer ${publicKey}`);
});

test('401 from the App API becomes KeyCapabilityError', async (t) => {
  respond(t.context.fetchStub, 401, { meta: { error: 'unauthorized' } });
  const cio = new CustomerIO({ apiKey: usKey });

  const error = await t.throwsAsync(cio.sendEmail(emailOptions), { instanceOf: KeyCapabilityError });
  t.is(error?.capability, 'transactional');
  t.is(error?.statusCode, 401);
  t.is(error?.message, "This key can't send transactional messages (401): unauthorized");
  t.true(error?.cause instanceof CustomerIORequestError);
});

test('403 from the Track API becomes KeyCapabilityError', async (t) => {
  respond(t.context.fetchStub, 403, { meta: { error: 'forbidden' } });
  const cio = new CustomerIO({ apiKey: usKey });

  const error = await t.throwsAsync(cio.identify('1', {}), { instanceOf: KeyCapabilityError });
  t.is(error?.capability, 'track');
  t.is(error?.statusCode, 403);
});

test('other request errors pass through unchanged', async (t) => {
  respond(t.context.fetchStub, 400, { meta: { error: 'bad request' } });
  const cio = new CustomerIO({ apiKey: usKey });

  const error = await t.throwsAsync(cio.identify('1', {}), { instanceOf: CustomerIORequestError });
  t.is(error?.statusCode, 400);
});

test('missing params still throw synchronously', (t) => {
  const cio = new CustomerIO({ apiKey: usKey });

  t.throws(() => cio.identify('', {}), { instanceOf: MissingParamError });
  t.true(t.context.fetchStub.notCalled);
});
