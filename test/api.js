const test = require('ava');
const fs = require('fs');
const sinon = require('sinon');
const APIClient = require('../lib/api');
const { SendEmailRequest } = require('../lib/api/requests');

const apiRoot = 'https://api.customer.io/v1';

test.beforeEach((t) => {
  t.context.client = new APIClient('appKey');
});

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.appKey, 'appKey');
  t.truthy(t.context.client.request);
});

test('sendEmail: passing in a plain object throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let message = { identifiers: { id: '2' }, transactional_message_id: 1 };
  t.throws(() => t.context.client.sendEmail(message), {
    message: /"message" must be an instance of SendEmailRequest/,
  });
  t.falsy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`));
});

test('#sendEmail: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let message = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });
  t.context.client.sendEmail(message);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, message.toObject()));
});

test('#sendEmail: adding attachments using a buffer object', (t) => {
  let buf = Buffer.from('hello world!');

  sinon.stub(t.context.client.request, 'post');
  let message = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  message.attach('test', buf);
  t.truthy(message.attachments.test, buf.toString('base64'));

  t.context.client.sendEmail(message);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, message.toObject()));
});

test('#sendEmail: adding attachments using filepath', (t) => {
  let buf = Buffer.from('hello world!');
  sinon.stub(fs, 'readFileSync').withArgs('test.pdf', 'base64').returns(buf.toString('base64'));
  sinon.stub(t.context.client.request, 'post');

  let message = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  message.attach('file', 'test.pdf');
  t.truthy(message.attachments.file, buf.toString('base64'));

  t.context.client.sendEmail(message);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, message.toObject()));
});

test('#sendEmail: adding unknown attachments', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let message = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  t.throws(() => message.attach('file', {}), { message: /unknown attachment type/ });

  t.context.client.sendEmail(message);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, message.toObject()));
});

test('#sendEmail: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });

  let message = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });
  t.context.client.sendEmail(message).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });

  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, message.toObject()));
});
