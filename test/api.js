const test = require('ava');
const sinon = require('sinon');
const CioApiClient = require('../lib/api');

const apiRoot = 'https://api.customer.io/v1';

test.beforeEach((t) => {
  t.context.client = new CioApiClient('appKey');
});

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.appKey, 'appKey');
  t.truthy(t.context.client.request);
});

test('#sendEmail works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let payload = { customer_id: '2', transactional_message_id: 1 };
  t.context.client.sendEmail(payload);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, payload));
});
