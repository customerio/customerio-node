import avaTest, { TestFn } from 'ava';
import sinon, { SinonStub } from 'sinon';
import { EmailClient } from '../lib/email';
import { RegionUS, RegionEU } from '../lib/regions';

type TestContext = { client: EmailClient };

const test = avaTest as TestFn<TestContext>;

test.beforeEach((t) => {
  t.context.client = new EmailClient({ apiKey: 'sdk_live_test' });
});

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.apiKey, 'sdk_live_test');
  t.truthy(t.context.client.request);
  t.is(t.context.client.apiRoot, RegionUS.apiUrl);
});

test('constructor sets correct URL for different regions', (t) => {
  [RegionUS, RegionEU].forEach((region) => {
    const client = new EmailClient({ apiKey: 'sdk_live_test', region });
    t.is(client.apiRoot, region.apiUrl);
  });
});

test('constructor sets correct URL for a custom URL', (t) => {
  const client = new EmailClient({ apiKey: 'sdk_live_test', url: 'https://example.com' });
  t.is(client.apiRoot, 'https://example.com');
});

test('constructor throws when apiKey is missing', (t) => {
  t.throws(() => new EmailClient({ apiKey: '' }), { message: /apiKey is required/ });
});

test('constructor throws on invalid region', (t) => {
  t.throws(() => new EmailClient({ apiKey: 'sdk_live_test', region: 'au' as any }), {
    message: 'region must be one of Regions.US or Regions.EU',
  });
});

test('send: POSTs to /send/email with the input as body', (t) => {
  const stub = sinon.stub(t.context.client.request, 'post');
  t.context.client.send({
    to: 'a@example.com',
    from: 'b@example.com',
    subject: 's',
    body: '<p>hi</p>',
  });
  t.truthy(
    (stub as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`, {
      to: 'a@example.com',
      from: 'b@example.com',
      subject: 's',
      body: '<p>hi</p>',
    }),
  );
});

test('send: throws on missing to', (t) => {
  t.throws(() => t.context.client.send({ to: '', from: 'b@example.com', subject: 's', body: 'b' } as any), {
    message: /SendEmailInput.to is required/,
  });
});

test('send: throws on missing from', (t) => {
  t.throws(() => t.context.client.send({ to: 'a@example.com', from: '', subject: 's', body: 'b' } as any), {
    message: /SendEmailInput.from is required/,
  });
});

test('send: throws on missing subject', (t) => {
  t.throws(
    () =>
      t.context.client.send({
        to: 'a@example.com',
        from: 'b@example.com',
        subject: '',
        body: 'b',
      } as any),
    { message: /SendEmailInput.subject is required/ },
  );
});

test('send: throws on missing body', (t) => {
  t.throws(
    () =>
      t.context.client.send({
        to: 'a@example.com',
        from: 'b@example.com',
        subject: 's',
        body: '',
      } as any),
    { message: /SendEmailInput.body is required/ },
  );
});

test('send: throws on non-string reply_to', (t) => {
  t.throws(
    () =>
      t.context.client.send({
        to: 'a@example.com',
        from: 'b@example.com',
        subject: 's',
        body: 'b',
        reply_to: 123 as any,
      }),
    { message: /reply_to must be a string/ },
  );
});

test('send: throws on non-string headers values', (t) => {
  t.throws(
    () =>
      t.context.client.send({
        to: 'a@example.com',
        from: 'b@example.com',
        subject: 's',
        body: 'b',
        headers: { 'X-Test': 123 as any },
      }),
    { message: /headers must map string->string/ },
  );
});

test('send: throws when input is not an object', (t) => {
  t.throws(() => t.context.client.send(null as any), {
    message: /SendEmailInput must be an object/,
  });
  t.throws(() => t.context.client.send('a string' as any), {
    message: /SendEmailInput must be an object/,
  });
});

test('send: throws when headers is not an object', (t) => {
  t.throws(
    () =>
      t.context.client.send({
        to: 'a@example.com',
        from: 'b@example.com',
        subject: 's',
        body: 'b',
        headers: 'not an object' as any,
      }),
    { message: /headers must be an object when provided/ },
  );
});

test('send: accepts valid optional fields', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.notThrows(() =>
    t.context.client.send({
      to: 'a@example.com',
      from: 'b@example.com',
      subject: 's',
      body: 'b',
      reply_to: 'replyto@example.com',
      headers: { 'X-Test': 'ok' },
    }),
  );
});
