const test = require('ava');
const sinon = require('sinon');
const { APIClient, SendEmailRequest } = require('../api');
const { RegionUS, RegionEU } = require('../lib/regions');

test.beforeEach((t) => {
  t.context.client = new APIClient('appKey');
});

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.appKey, 'appKey');
  t.truthy(t.context.client.request);
  t.is(t.context.client.apiRoot, RegionUS.apiUrl);
});

test('constructor sets correct URL for different regions', (t) => {
  [RegionUS, RegionEU].forEach((region) => {
    let client = new APIClient('appKey', { region });

    t.is(client.appKey, 'appKey');
    t.truthy(client.request);
    t.is(client.apiRoot, region.apiUrl);
  });
});

test('passing in an invalid region throws an error', (t) => {
  t.throws(
    () => {
      new APIClient('appKey', { region: 'au' });
    },
    {
      message: 'region must be one of Regions.US or Regions.EU',
    },
  );
});

test('sendEmail: passing in a plain object throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = { identifiers: { id: '2' }, transactional_message_id: 1 };
  t.throws(() => t.context.client.sendEmail(req), {
    message: /"request" must be an instance of SendEmailRequest/,
  });
  t.falsy(t.context.client.request.post.calledWith(`${RegionUS.apiUrl}/send/email`));
});

test('#sendEmail: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });
  t.context.client.sendEmail(req);
  t.truthy(t.context.client.request.post.calledWith(`${RegionUS.apiUrl}/send/email`, req.message));
});

test('#sendEmail: adding attachments with encoding (default)', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('test', 'hello world');
  t.is(req.message.attachments.test, Buffer.from('hello world').toString('base64'));
});

test('#sendEmail: adding attachments without encoding', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('file', 'test content', { encode: false });
  t.truthy(req.message.attachments.file, 'test content');
});

test('#sendEmail: adding attachments twice throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('test', 'test content');
  t.throws(() => req.attach('test', 'test content 2'), { message: /attachment test already exists/ });
  t.is(req.message.attachments.test, Buffer.from('test content').toString('base64'));
});

test('#sendEmail: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });

  let req = new SendEmailRequest({ identifiers: { id: '2' }, transactional_message_id: 1 });
  t.context.client.sendEmail(req).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });

  t.truthy(t.context.client.request.post.calledWith(`${RegionUS.apiUrl}/send/email`, req.message));
});
