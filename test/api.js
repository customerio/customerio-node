const test = require('ava');
const sinon = require('sinon');
const APIClient = require('../lib/api');

const apiRoot = 'https://api.customer.io/v1';

test.beforeEach((t) => {
  t.context.client = new APIClient('appKey');
});

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.appKey, 'appKey');
  t.truthy(t.context.client.request);
});

test('#sendEmail: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let payload = { customer_id: '2', transactional_message_id: 1 };
  t.context.client.sendEmail(payload);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, payload));
});

test('#sendEmail: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });
  let payload = { customer_id: '2', transactional_message_id: 1 };
  t.context.client.sendEmail(payload).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, payload));
});
