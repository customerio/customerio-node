import avaTest, { TestFn } from 'ava';
import { cleanEmail, verifyWebhookSignature } from '../lib/utils';

type TestContext = {};

const test = avaTest as TestFn<TestContext>;

test('#cleanEmail correctly formats email (default)', (t) => {
  let email = 'hello+test@world.com';
  let result = cleanEmail(email);
  t.is(result, 'hello%2Btest@world.com');

  email = 'test@world.com';
  result = cleanEmail(email);
  t.is(result, 'test@world.com');

  email = '';
  result = cleanEmail(email);
  t.is(result, '');
});

test('#verifyWebhookSignature: should return false if an argument is empty', (t) => {
  const timestamp = '';
  const payload = '{"hello": "world"}';
  const signature = '2380722c30fe151144a151cbbf6b5a207291314d78582594cb18bcdb66098d5c';
  const webhookSigningSecret = 'abcd';
  t.throws(() => verifyWebhookSignature(webhookSigningSecret, timestamp, signature, Buffer.from(payload)), {
    message: 'webhookSigningSecret, timestamp, signature, payload is required',
  });
});

test('#verifyWebhookSignature: should return false if signature is wrong', (t) => {
  const timestamp = '1536353830';
  const payload = '{"hello": "world"}';
  const signature = '2e4c14c338df161be248bca5cf0e7836a96077c6f773a97e6b8f3e0cc9a14a1a';
  const webhookSigningSecret = 'abcd';
  t.false(verifyWebhookSignature(webhookSigningSecret, timestamp, signature, Buffer.from(payload)));
});

test('#verifyWebhookSignature: should return true if signature is matching', (t) => {
  const timestamp = '1536353830';
  const payload = '{"hello": "world"}';
  const signature = '2380722c30fe151144a151cbbf6b5a207291314d78582594cb18bcdb66098d5c';
  const webhookSigningSecret = 'abcd';
  t.true(verifyWebhookSignature(webhookSigningSecret, timestamp, signature, Buffer.from(payload)));
});
