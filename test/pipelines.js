import test from 'ava';
import sinon from 'sinon';
import { PipelinesClient } from '../lib/pipelines.js';
import { RegionUS, RegionEU } from '../lib/regions.js';
import { version } from '../lib/version.js';

const WRITE_KEY = 'wk-abc-123';
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

test.beforeEach((t) => {
  t.context.client = new PipelinesClient(WRITE_KEY);
});

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.writeKey, WRITE_KEY);
  t.is(t.context.client.pipelinesRoot, 'https://cdp.customer.io/v1');
  t.truthy(t.context.client.request);
});

test('constructor sets correct URL for RegionUS', (t) => {
  const client = new PipelinesClient(WRITE_KEY, { region: RegionUS });
  t.is(client.pipelinesRoot, 'https://cdp.customer.io/v1');
});

test('constructor sets correct URL for RegionEU', (t) => {
  const client = new PipelinesClient(WRITE_KEY, { region: RegionEU });
  t.is(client.pipelinesRoot, 'https://cdp-eu.customer.io/v1');
});

test('constructor honors a custom url override', (t) => {
  const client = new PipelinesClient(WRITE_KEY, { url: 'https://cdp.example.com/v1' });
  t.is(client.pipelinesRoot, 'https://cdp.example.com/v1');
});

test('constructor uses Basic auth with the write key as username and a blank password', (t) => {
  const expected = `Basic ${Buffer.from(`${WRITE_KEY}:`, 'utf8').toString('base64')}`;
  t.is(t.context.client.request.auth, expected);
});

test('constructor throws when writeKey is missing', (t) => {
  t.throws(() => new PipelinesClient(''), { message: 'writeKey is required' });
});

test('constructor throws on an invalid region', (t) => {
  t.throws(() => new PipelinesClient(WRITE_KEY, /** @type {any} */ ({ region: 'au' })), {
    message: 'region must be one of Regions.US or Regions.EU',
  });
});

test('constructor adds X-Strict-Mode: 1 to defaults.headers when strictMode is true', (t) => {
  const client = new PipelinesClient(WRITE_KEY, { strictMode: true });
  t.is(/** @type {Record<string, string>} */ (client.defaults.headers)['X-Strict-Mode'], '1');
});

test('constructor preserves caller-supplied headers when adding X-Strict-Mode', (t) => {
  const client = new PipelinesClient(WRITE_KEY, {
    strictMode: true,
    headers: { 'X-Custom': 'yes' },
  });
  const headers = /** @type {Record<string, string>} */ (client.defaults.headers);
  t.is(headers['X-Strict-Mode'], '1');
  t.is(headers['X-Custom'], 'yes');
});

test('constructor omits X-Strict-Mode when strictMode is not set', (t) => {
  const headers = /** @type {Record<string, string>} */ (t.context.client.defaults.headers ?? {});
  t.false('X-Strict-Mode' in headers);
});

test('#identify auto-fills messageId, timestamp, and context.library', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.identify({ userId: 'u1', traits: { plan: 'pro' } });

  const [url, body] = /** @type {[string, any]} */ (post.firstCall.args);
  t.is(url, 'https://cdp.customer.io/v1/identify');
  t.regex(body.messageId, UUID_RE);
  t.regex(body.timestamp, ISO_TIMESTAMP_RE);
  t.deepEqual(body.context.library, { name: 'customerio-node', version });
  t.is(body.userId, 'u1');
  t.deepEqual(body.traits, { plan: 'pro' });
});

test('#identify preserves caller-supplied messageId, timestamp, and context.library', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.identify({
    userId: 'u1',
    messageId: 'caller-msg-id',
    timestamp: '2024-01-01T00:00:00.000Z',
    context: { library: { name: 'my-app', version: '9.9.9' } },
  });

  const [, body] = /** @type {[string, any]} */ (post.firstCall.args);
  t.is(body.messageId, 'caller-msg-id');
  t.is(body.timestamp, '2024-01-01T00:00:00.000Z');
  t.deepEqual(body.context.library, { name: 'my-app', version: '9.9.9' });
});

test('defaultContext from defaults merges under per-call context', (t) => {
  const client = new PipelinesClient(WRITE_KEY, {
    defaultContext: { ip: '10.0.0.1', locale: 'en-US' },
  });
  const post = sinon.stub(client.request, 'post');

  client.identify({ userId: 'u1', context: { locale: 'fr-FR' } });
  const [, body] = /** @type {[string, any]} */ (post.firstCall.args);

  t.is(body.context.ip, '10.0.0.1', 'defaultContext.ip flows through');
  t.is(body.context.locale, 'fr-FR', 'per-call context wins on conflict');
  t.deepEqual(body.context.library, { name: 'customerio-node', version });
});

test('#identify validates userId or anonymousId is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.identify(/** @type {any} */ ({})), { message: 'userId or anonymousId is required' });
});

test('#identify accepts anonymousId-only payloads', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.identify({ anonymousId: 'anon-1' });
  t.is(post.firstCall.args[0], 'https://cdp.customer.io/v1/identify');
  t.is(/** @type {any} */ (post.firstCall.args[1]).anonymousId, 'anon-1');
});

test('#track validates userId or anonymousId is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.track(/** @type {any} */ ({ event: 'Signed Up' })), {
    message: 'userId or anonymousId is required',
  });
});

test('#track validates event is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.track(/** @type {any} */ ({ userId: 'u1' })), { message: 'event is required' });
});

test('#track posts to /track with the event payload', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.track({ userId: 'u1', event: 'Signed Up', properties: { plan: 'pro' } });

  const [url, body] = /** @type {[string, any]} */ (post.firstCall.args);
  t.is(url, 'https://cdp.customer.io/v1/track');
  t.is(body.event, 'Signed Up');
  t.deepEqual(body.properties, { plan: 'pro' });
});

test('#page validates userId or anonymousId is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.page(/** @type {any} */ ({})), { message: 'userId or anonymousId is required' });
});

test('#page posts to /page', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.page({ userId: 'u1', name: 'Home', properties: { path: '/' } });
  t.is(post.firstCall.args[0], 'https://cdp.customer.io/v1/page');
});

test('#screen validates userId or anonymousId is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.screen(/** @type {any} */ ({})), { message: 'userId or anonymousId is required' });
});

test('#screen posts to /screen', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.screen({ userId: 'u1', name: 'Settings' });
  t.is(post.firstCall.args[0], 'https://cdp.customer.io/v1/screen');
});

test('#group validates userId or anonymousId is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.group(/** @type {any} */ ({ groupId: 'g1' })), {
    message: 'userId or anonymousId is required',
  });
});

test('#group validates groupId is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.group(/** @type {any} */ ({ userId: 'u1' })), { message: 'groupId is required' });
});

test('#group posts to /group with the groupId and traits', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.group({ userId: 'u1', groupId: 'g1', traits: { plan: 'enterprise' } });

  const [url, body] = /** @type {[string, any]} */ (post.firstCall.args);
  t.is(url, 'https://cdp.customer.io/v1/group');
  t.is(body.groupId, 'g1');
  t.deepEqual(body.traits, { plan: 'enterprise' });
});

test('#alias validates userId is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.alias(/** @type {any} */ ({ previousId: 'p1' })), { message: 'userId is required' });
});

test('#alias validates previousId is required', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.alias(/** @type {any} */ ({ userId: 'u1' })), { message: 'previousId is required' });
});

test('#alias posts to /alias', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.alias({ userId: 'u1', previousId: 'p1' });

  const [url, body] = /** @type {[string, any]} */ (post.firstCall.args);
  t.is(url, 'https://cdp.customer.io/v1/alias');
  t.is(body.userId, 'u1');
  t.is(body.previousId, 'p1');
});

test('#batch throws when items is empty', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.batch([]), { message: 'items is required' });
});

test('#batch throws when items is not an array', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.batch(/** @type {any} */ ({})), { message: 'items is required' });
});

test('#batch posts to /batch, envelopes every item, and preserves the type discriminator', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  const items = [
    { type: 'identify', userId: 'u1', traits: { plan: 'pro' } },
    { type: 'track', userId: 'u1', event: 'Signed Up' },
    { type: 'alias', userId: 'u1', previousId: 'p1' },
  ];

  t.context.client.batch(items);

  const [url, body] = /** @type {[string, any]} */ (post.firstCall.args);
  t.is(url, 'https://cdp.customer.io/v1/batch');
  t.is(body.batch.length, 3);

  for (const [i, entry] of body.batch.entries()) {
    t.is(entry.type, items[i].type, `item ${i} preserves its type discriminator`);
    t.regex(entry.messageId, UUID_RE, `item ${i} got an auto messageId`);
    t.regex(entry.timestamp, ISO_TIMESTAMP_RE, `item ${i} got an auto timestamp`);
    t.deepEqual(entry.context.library, { name: 'customerio-node', version });
  }
});

test('#batch routes EU traffic to the EU host', (t) => {
  const client = new PipelinesClient(WRITE_KEY, { region: RegionEU });
  const post = sinon.stub(client.request, 'post');
  client.batch([{ type: 'track', userId: 'u1', event: 'X' }]);
  t.is(post.firstCall.args[0], 'https://cdp-eu.customer.io/v1/batch');
});
