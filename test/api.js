const test = require('ava');
const sinon = require('sinon');
const APIClient = require('../lib/api');
const TransactionalEmail = require('../lib/transactional-email');

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
  let message = new TransactionalEmail({ customer_id: '2', transactional_message_id: 1 });
  t.context.client.sendEmail(message);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, message.toObject()));
});

test('#sendEmail: adding attachments', (t) => {
  let buf = Buffer.from('hello world!');

  sinon.stub(t.context.client.request, 'post');
  let message = new TransactionalEmail({ customer_id: '2', transactional_message_id: 1 });

  message.attach('test', buf);
  t.truthy(message.attachments.test, buf.toString('base64'));

  t.context.client.sendEmail(message);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, message.toObject()));
});

test('#sendEmail: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });
  let message = new TransactionalEmail({ customer_id: '2', transactional_message_id: 1 });
  t.context.client.sendEmail(message).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, message.toObject()));
});
