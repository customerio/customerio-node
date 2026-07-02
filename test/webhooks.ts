import test from 'ava';
import { createHmac } from 'crypto';
import { verifyRequestSignature } from '../lib/webhooks';
import { MissingParamError } from '../lib/utils';

const SIGNING_SECRET = 'signing-secret';
const TIMESTAMP = '1614265384';
const BODY = JSON.stringify({ event_id: 'abc', object_type: 'email', metric: 'delivered' });

const sign = (secret: string, timestamp: string | number, body: string | Buffer) =>
  createHmac('sha256', secret).update(`v0:${timestamp}:`).update(body).digest('hex');

test('returns true for a valid signature', (t) => {
  const signature = sign(SIGNING_SECRET, TIMESTAMP, BODY);

  t.true(verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: TIMESTAMP, body: BODY, signature }));
});

test('matches the documented v0:timestamp:body HMAC-SHA256 hex scheme', (t) => {
  // Golden value computed independently; locks the signing scheme against regressions.
  const signature = '6f55cf23f9b73a2ff07733fe04421f64ce9ec5e409696edda6b2a80311944230';

  t.true(verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: TIMESTAMP, body: BODY, signature }));
});

test('accepts a numeric timestamp equivalently to its string form', (t) => {
  const signature = sign(SIGNING_SECRET, TIMESTAMP, BODY);

  t.true(
    verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: Number(TIMESTAMP), body: BODY, signature }),
  );
});

test('accepts a raw Buffer body', (t) => {
  const body = Buffer.from(BODY, 'utf8');
  const signature = sign(SIGNING_SECRET, TIMESTAMP, body);

  t.true(verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: TIMESTAMP, body, signature }));
});

test('returns false when the body has been tampered with', (t) => {
  const signature = sign(SIGNING_SECRET, TIMESTAMP, BODY);
  const tamperedBody = BODY.replace('delivered', 'bounced');

  t.false(
    verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: TIMESTAMP, body: tamperedBody, signature }),
  );
});

test('returns false when the timestamp does not match the signed one', (t) => {
  const signature = sign(SIGNING_SECRET, TIMESTAMP, BODY);

  t.false(verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: '1614265385', body: BODY, signature }));
});

test('returns false when signed with a different secret', (t) => {
  const signature = sign('other-secret', TIMESTAMP, BODY);

  t.false(verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: TIMESTAMP, body: BODY, signature }));
});

test('returns false for a signature of the wrong length', (t) => {
  t.false(
    verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: TIMESTAMP, body: BODY, signature: 'abc' }),
  );
});

test('returns false for an empty signature', (t) => {
  t.false(verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: TIMESTAMP, body: BODY, signature: '' }));
});

test('returns false for a non-string signature (e.g. a repeated header)', (t) => {
  const signature = ['sig-a', 'sig-b'] as unknown as string;

  t.false(verifyRequestSignature({ signingSecret: SIGNING_SECRET, timestamp: TIMESTAMP, body: BODY, signature }));
});

test('throws MissingParamError when the signing secret is empty', (t) => {
  const signature = sign(SIGNING_SECRET, TIMESTAMP, BODY);

  const error = t.throws(
    () => verifyRequestSignature({ signingSecret: '', timestamp: TIMESTAMP, body: BODY, signature }),
    { instanceOf: MissingParamError },
  );
  t.is(error.message, 'signingSecret is required');
});
