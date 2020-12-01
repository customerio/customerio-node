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
  let req = { identifiers: { id: '2' }, transactional_message_id: 1 };
  t.throws(() => t.context.client.sendEmail(req), {
    message: /"request" must be an instance of SendEmailRequest/,
  });
  t.falsy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`));
});

test('#sendEmail: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });
  t.context.client.sendEmail(req);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, req.message));
});

test('#sendEmail: adding attachments using a buffer object', (t) => {
  let buf = Buffer.from('hello world!');

  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('test', buf);
  t.truthy(req.message.attachments.test, buf.toString('base64'));

  t.context.client.sendEmail(req);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, req.message));
});

test('#sendEmail: adding attachments using filepath', (t) => {
  let buf = Buffer.from('hello world!');
  sinon.stub(fs, 'readFileSync').withArgs('test.pdf', 'base64').returns(buf.toString('base64'));
  sinon.stub(t.context.client.request, 'post');

  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('file', 'test.pdf');
  t.truthy(req.message.attachments.file, buf.toString('base64'));

  t.context.client.sendEmail(req);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, req.message));
});

test('#sendEmail: adding unknown attachments', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  t.throws(() => req.attach('file', {}), { message: /unknown attachment type/ });

  t.context.client.sendEmail(req);
  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, req.message));
});

test('#sendEmail: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });

  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });
  t.context.client.sendEmail(req).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });

  t.truthy(t.context.client.request.post.calledWith(`${apiRoot}/send/email`, req.message));
});
