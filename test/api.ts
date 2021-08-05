import avaTest, { TestInterface } from 'ava';
import sinon, { SinonStub } from 'sinon';
import { APIClient, SendEmailRequest } from '../lib/api';
import { RegionUS, RegionEU } from '../lib/regions';

type TestContext = { client: APIClient };

const test = avaTest as TestInterface<TestContext>;

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

test('constructor sets correct URL for a custom URL', (t) => {
  let client = new APIClient('appKey', { url: 'https://example.com' });

  t.is(client.appKey, 'appKey');
  t.truthy(client.request);
  t.is(client.apiRoot, 'https://example.com');
});

test('passing in an invalid region throws an error', (t) => {
  t.throws(
    () => {
      new APIClient('appKey', { region: 'au' } as any);
    },
    {
      message: 'region must be one of Regions.US or Regions.EU',
    },
  );
});

test('sendEmail: passing in a plain object throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');

  let req = { identifiers: { id: '2' }, transactional_message_id: 1 };

  t.throws(() => t.context.client.sendEmail(req as any), {
    message: /"request" must be an instance of SendEmailRequest/,
  });
  t.falsy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`));
});

test('#sendEmail: with template: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });
  t.context.client.sendEmail(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`, req.message));
});

test('#sendEmail: without template: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({
    to: 'test@example.com',
    identifiers: { id: '2' },
    from: 'admin@example.com',
    subject: 'This is a test',
    body: 'Hi there!',
  });
  t.context.client.sendEmail(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`, req.message));
});

test('#sendEmail: override from: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({
    to: 'test@example.com',
    identifiers: { id: '2' },
    transactional_message_id: 1,
    from: 'admin@example.com',
  });
  t.context.client.sendEmail(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`, req.message));
});

test('#sendEmail: override subject: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({
    to: 'test@example.com',
    identifiers: { id: '2' },
    transactional_message_id: 1,
    subject: 'This is a test',
  });
  t.context.client.sendEmail(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`, req.message));
});

test('#sendEmail: override body: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({
    to: 'test@example.com',
    identifiers: { id: '2' },
    transactional_message_id: 1,
    body: 'Hi there!',
  });
  t.context.client.sendEmail(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`, req.message));
});

test('#sendEmail: adding attachments with encoding (default)', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('test', 'hello world');
  t.is(req.message.attachments.test, Buffer.from('hello world').toString('base64'));
});

test('#sendEmail: adding attachments without encoding', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('file', 'test content', { encode: false });
  t.truthy(req.message.attachments.file, 'test content');
});

test('#sendEmail: adding attachments twice throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('test', 'test content');
  t.throws(() => req.attach('test', 'test content 2'), { message: /attachment test already exists/ });
  t.is(req.message.attachments.test, Buffer.from('test content').toString('base64'));
});

test('#sendEmail: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });

  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });
  t.context.client.sendEmail(req).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });

  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`, req.message));
});

test('#triggerBroadcast works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(1, { type: 'data' }, { type: 'recipients' });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/api/campaigns/1/triggers`, {
      data: { type: 'data' },
      recipients: { type: 'recipients' },
    }),
  );
});

test('#triggerBroadcast works with emails', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(
    1,
    { type: 'data' },
    {
      emails: ['test@email.com'],
      email_ignore_missing: true,
      email_add_duplicates: true,
    },
  );
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/api/campaigns/1/triggers`, {
      data: { type: 'data' },
      emails: ['test@email.com'],
      email_ignore_missing: true,
      email_add_duplicates: true,
    }),
  );
});

test('#triggerBroadcast works with ids', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(1, { type: 'data' }, { ids: [1], id_ignore_missing: true });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/api/campaigns/1/triggers`, {
      data: { type: 'data' },
      ids: [1],
      id_ignore_missing: true,
    }),
  );
});

test('#triggerBroadcast works with per_user_data', (t) => {
  sinon.stub(t.context.client.request, 'post');
  const per_user_data = [{ id: 1, data: { very: 'important' } }];
  t.context.client.triggerBroadcast(1, { type: 'data' }, { per_user_data, id_ignore_missing: true });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/api/campaigns/1/triggers`, {
      data: { type: 'data' },
      per_user_data,
      id_ignore_missing: true,
    }),
  );
});

test('#triggerBroadcast works with data_file_url', (t) => {
  sinon.stub(t.context.client.request, 'post');
  const data_file_url = 'https://my.s3.bucket.com';
  t.context.client.triggerBroadcast(1, { type: 'data' }, { data_file_url, id_ignore_missing: true });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/api/campaigns/1/triggers`, {
      data: { type: 'data' },
      data_file_url,
      id_ignore_missing: true,
    }),
  );
});

test('#triggerBroadcast discards extraneous fields', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(
    1,
    { type: 'data' },
    {
      ids: [1],
      id_ignore_missing: true,
      emails: ['test@email.com'],
      exampleField: true,
    },
  );
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/api/campaigns/1/triggers`, {
      data: { type: 'data' },
      ids: [1],
      id_ignore_missing: true,
    }),
  );
});
