import type { TestFn } from 'ava';
import avaTest from 'ava';
import type { SinonStub } from 'sinon';
import sinon from 'sinon';
import type { DeliveryExportRequestOptions } from '../lib/api';
import {
  APIClient,
  DeliveryExportMetric,
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from '../lib/api';
import { RegionUS, RegionEU } from '../lib/regions';
import type { Filter } from '../lib/types';
import { IdentifierType } from '../lib/types';

type TestContext = { client: APIClient };

const test = avaTest as TestFn<TestContext>;

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
  t.falsy(req.message.from);
  t.falsy(req.message.subject);
  t.falsy(req.message.body);
  t.is(req.message.transactional_message_id, 1);
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
  t.is(req.message.from, 'admin@example.com');
  t.is(req.message.subject, 'This is a test');
  t.is(req.message.body, 'Hi there!');
  t.falsy(req.message.transactional_message_id);
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
  t.is(req.message.from, 'admin@example.com');
  t.falsy(req.message.subject);
  t.falsy(req.message.body);
  t.is(req.message.transactional_message_id, 1);
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
  t.falsy(req.message.from);
  t.is(req.message.subject, 'This is a test');
  t.falsy(req.message.body);
  t.is(req.message.transactional_message_id, 1);
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
  t.falsy(req.message.from);
  t.falsy(req.message.subject);
  t.is(req.message.body, 'Hi there!');
  t.is(req.message.transactional_message_id, 1);
});

test('sendPush: passing in a plain object throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');

  let req = { identifiers: { id: '2' }, transactional_message_id: 1 };

  t.throws(() => t.context.client.sendPush(req as any), {
    message: /"request" must be an instance of SendPushRequest/,
  });
  t.falsy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/push`));
});

test('#sendPush: with custom payload: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendPushRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
    custom_payload: { ios: { foo: 'bar' }, android: { foo: 'bar' } },
  });
  t.context.client.sendPush(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/push`, req.message));
  t.is(req.message.transactional_message_id, 1);
  t.deepEqual(req.message.custom_payload, { ios: { foo: 'bar' }, android: { foo: 'bar' } });
});

test('#sendPush: without custom payload: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendPushRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
    title: 'This is a test',
    message: 'Hi there!',
    message_data: { foo: 'bar' },
  });

  t.context.client.sendPush(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/push`, req.message));
  t.is(req.message.transactional_message_id, 1);
  t.is(req.message.title, 'This is a test');
  t.is(req.message.message, 'Hi there!');
  t.deepEqual(req.message.message_data, { foo: 'bar' });
  t.falsy(req.message.custom_payload);
});

test('#sendPush: maps device to custom_device', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendPushRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
    device: { token: 'abc123' },
  });

  t.context.client.sendPush(req);
  t.deepEqual(req.message.custom_device, { token: 'abc123' });
});

test('#getCustomersByEmail: searching for a customer email (default)', (t) => {
  sinon.stub(t.context.client.request, 'get');

  const email = 'hello@world.com';
  t.context.client.getCustomersByEmail(email);
  t.truthy(
    (t.context.client.request.get as SinonStub).calledWith(
      `${RegionUS.apiUrl}/customers?email=${encodeURIComponent(email)}`,
    ),
  );
});

test('#getCustomersByEmail: encodes reserved characters in email', (t) => {
  sinon.stub(t.context.client.request, 'get');

  const email = 'user+tag&filter=1@example.com';
  t.context.client.getCustomersByEmail(email);
  t.truthy(
    (t.context.client.request.get as SinonStub).calledWith(
      `${RegionUS.apiUrl}/customers?email=${encodeURIComponent(email)}`,
    ),
  );
});

test('#getCustomersByEmail: encodes hash and question mark in email', (t) => {
  sinon.stub(t.context.client.request, 'get');

  const email = 'user#name?q=1@example.com';
  t.context.client.getCustomersByEmail(email);
  t.truthy(
    (t.context.client.request.get as SinonStub).calledWith(
      `${RegionUS.apiUrl}/customers?email=${encodeURIComponent(email)}`,
    ),
  );
});

test('#getCustomersByEmail: should throw error when email is empty', (t) => {
  const email = '';
  t.throws(() => t.context.client.getCustomersByEmail(email));
});

test('#getCustomersByEmail: should throw error when email is null', (t) => {
  const email: unknown = null;
  t.throws(() => t.context.client.getCustomersByEmail(email as string));
});

test('#getCustomersByEmail: should throw error when email is undefined', (t) => {
  const email: unknown = undefined;
  t.throws(() => t.context.client.getCustomersByEmail(email as string));
});

test('#getCustomersByEmail: should throw error when email is not a string object', (t) => {
  const email: unknown = { object: 'test' };
  t.throws(() => t.context.client.getCustomersByEmail(email as string));
});

test('#sendEmail: message does not include attachments key when none are added', (t) => {
  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });
  t.false('attachments' in req.message);
});

test('#sendEmail: adding attachments with encoding (default)', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('test', 'hello world');
  t.is(req.message.attachments!.test, Buffer.from('hello world').toString('base64'));
});

test('#sendEmail: adding attachments without encoding', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('file', 'test content', { encode: false });
  t.truthy(req.message.attachments!.file, 'test content');
});

test('#sendEmail: adding attachments twice throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendEmailRequest({ to: 'test@example.com', identifiers: { id: '2' }, transactional_message_id: 1 });

  req.attach('test', 'test content');
  t.throws(() => req.attach('test', 'test content 2'), { message: /attachment test already exists/ });
  t.is(req.message.attachments!.test, Buffer.from('test content').toString('base64'));
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
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {
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
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {
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
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {
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
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {
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
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {
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
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {
      data: { type: 'data' },
      ids: [1],
      id_ignore_missing: true,
    }),
  );
});

test('#triggerBroadcast works with broadcastId only', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(1);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {}));
});

test('#triggerBroadcast works with data and no recipients', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(1, { type: 'data' });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {
      data: { type: 'data' },
    }),
  );
});

test('#triggerBroadcast works with recipients and no data', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(1, undefined, { emails: ['test@email.com'], email_ignore_missing: true });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {
      emails: ['test@email.com'],
      email_ignore_missing: true,
    }),
  );
});

test('#triggerBroadcast omits empty data and recipients objects', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(1, {}, {});
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/1/triggers`, {}));
});

test('#listExports: success', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.context.client.listExports();
  t.truthy((t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/exports`));
});

test('#getExport: success', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.context.client.getExport(1);
  t.truthy((t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/1`));
});

test('#getExport: fails without id', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getExport(''), {
    message: 'id is required',
  });
  t.falsy((t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/1`));
});

test('#downloadExport: success', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.context.client.downloadExport(1);
  t.truthy((t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/1/download`));
});

test('#downloadExport: fails without id', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.downloadExport(''), {
    message: 'id is required',
  });
  t.falsy((t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/1/download`));
});

test('#createCustomersExport: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  const filters: Filter = {
    and: [
      {
        segment: {
          id: 1,
        },
      },
    ],
  };
  t.context.client.createCustomersExport(filters);
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/customers`, {
      filters,
    }),
  );
});

test('#createCustomersExport: fails without filters', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => (t.context.client.createCustomersExport as any)(), {
    message: 'filters is required',
  });
  t.falsy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/customers`));
});

test('#createDeliveriesExport: success with options', (t) => {
  sinon.stub(t.context.client.request, 'post');
  const options: DeliveryExportRequestOptions = {
    metric: DeliveryExportMetric.Attempted,
    start: new Date().getTime(),
    end: new Date().getTime(),
    attributes: ['attr1'],
    drafts: false,
  };
  t.context.client.createDeliveriesExport(1, options);
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/deliveries`, {
      newsletter_id: 1,
      ...options,
    }),
  );
});

test('#createDeliveriesExport: success without options', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.createDeliveriesExport(1);
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/deliveries`, {
      newsletter_id: 1,
    }),
  );
});

test('#createDeliveriesExport: fails without id', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => (t.context.client.createDeliveriesExport as any)(), {
    message: 'newsletterId is required',
  });
  t.falsy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/deliveries`));
});

test('#getAttributes: fails without id', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.throws(() => (t.context.client.getAttributes as any)(), {
    message: 'id is required',
  });
  t.falsy(
    (t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/customers/1/attributes?id_type=id`),
  );
});

test('#getAttributes: fails if id_type is not id, cio_id nor email', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.throws(() => (t.context.client.getAttributes as any)(1, 'first_name'), {
    message: 'idType must be one of "id", "cio_id", or "email"',
  });
  t.falsy(
    (t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/customers/1/attributes?id_type=id`),
  );
});

test('#getAttributes: fails if id_type is null', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.throws(() => (t.context.client.getAttributes as any)(1, null), {
    message: 'idType must be one of "id", "cio_id", or "email"',
  });
  t.falsy(
    (t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/customers/1/attributes?id_type=id`),
  );
});

test('#getAttributes: success with default type id', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.context.client.getAttributes('1');
  t.truthy(
    (t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/customers/1/attributes?id_type=id`),
  );
});

test('#getAttributes: success with type id', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.context.client.getAttributes('1', IdentifierType.Id);
  t.truthy(
    (t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/customers/1/attributes?id_type=id`),
  );
});

test('#getAttributes: success with type cio id', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.context.client.getAttributes('1', IdentifierType.CioId);
  t.truthy(
    (t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/customers/1/attributes?id_type=cio_id`),
  );
});

test('#getAttributes: success with type email', (t) => {
  sinon.stub(t.context.client.request, 'get');
  t.context.client.getAttributes('test@email.com', IdentifierType.Email);
  t.truthy(
    (t.context.client.request.get as SinonStub).calledWith(
      `${RegionUS.apiUrl}/customers/${encodeURIComponent('test@email.com')}/attributes?id_type=email`,
    ),
  );
});

test('sendSMS: passing in a plain object throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');

  let req = { identifiers: { id: '2' }, transactional_message_id: 1 };

  t.throws(() => t.context.client.sendSMS(req as any), {
    message: /"request" must be an instance of SendSMSRequest/,
  });
  t.falsy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/sms`));
});

test('#sendSMS: with template: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendSMSRequest({
    to: '+1234567890',
    identifiers: { id: '2' },
    transactional_message_id: 1,
  });
  t.context.client.sendSMS(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/sms`, req.message));
  t.is(req.message.transactional_message_id, 1);
  t.is(req.message.to, '+1234567890');
});

test('#sendSMS: with optional parameters: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendSMSRequest({
    to: '+1234567890',
    identifiers: { id: '2' },
    transactional_message_id: 1,
    message_data: { key: 'value' },
    disable_message_retention: true,
    send_to_unsubscribed: true,
    queue_draft: true,
    send_at: 1234567890,
    language: 'en',
  });
  t.context.client.sendSMS(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/sms`, req.message));
  t.is(req.message.transactional_message_id, 1);
  t.is(req.message.to, '+1234567890');
  t.deepEqual(req.message.message_data, { key: 'value' });
  t.true(req.message.disable_message_retention);
  t.true(req.message.send_to_unsubscribed);
  t.true(req.message.queue_draft);
  t.is(req.message.send_at, 1234567890);
  t.is(req.message.language, 'en');
});

test('#sendSMS: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });

  let req = new SendSMSRequest({
    to: '+1234567890',
    identifiers: { id: '2' },
    transactional_message_id: 1,
  });
  t.context.client.sendSMS(req).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });

  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/sms`, req.message));
});

test('sendInboxMessage: passing in a plain object throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');

  let req = { identifiers: { id: '2' }, transactional_message_id: 1 };

  t.throws(() => t.context.client.sendInboxMessage(req as any), {
    message: /"request" must be an instance of SendInboxMessageRequest/,
  });
  t.falsy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/inbox_message`));
});

test('#sendInboxMessage: with template: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendInboxMessageRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
  });
  t.context.client.sendInboxMessage(req);
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/inbox_message`, req.message),
  );
  t.is(req.message.transactional_message_id, 1);
  t.deepEqual(req.message.identifiers, { id: '2' });
});

test('#sendInboxMessage: with optional parameters: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendInboxMessageRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
    message_data: { key: 'value' },
    disable_message_retention: true,
    queue_draft: true,
    send_at: 1234567890,
    language: 'en',
  });
  t.context.client.sendInboxMessage(req);
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/inbox_message`, req.message),
  );
  t.is(req.message.transactional_message_id, 1);
  t.deepEqual(req.message.identifiers, { id: '2' });
  t.deepEqual(req.message.message_data, { key: 'value' });
  t.true(req.message.disable_message_retention);
  t.true(req.message.queue_draft);
  t.is(req.message.send_at, 1234567890);
  t.is(req.message.language, 'en');
});

test('#sendInboxMessage: with email identifier: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendInboxMessageRequest({
    identifiers: { email: 'test@example.com' },
    transactional_message_id: 1,
  });
  t.context.client.sendInboxMessage(req);
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/inbox_message`, req.message),
  );
  t.is(req.message.transactional_message_id, 1);
  t.deepEqual(req.message.identifiers, { email: 'test@example.com' });
});

test('#sendInboxMessage: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });

  let req = new SendInboxMessageRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
  });
  t.context.client.sendInboxMessage(req).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });

  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/inbox_message`, req.message),
  );
});

test('sendInApp: passing in a plain object throws an error', (t) => {
  sinon.stub(t.context.client.request, 'post');

  let req = { identifiers: { id: '2' }, transactional_message_id: 1 };

  t.throws(() => t.context.client.sendInApp(req as any), {
    message: /"request" must be an instance of SendInAppRequest/,
  });
  t.falsy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/in_app`));
});

test('#sendInApp: with template: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendInAppRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
  });
  t.context.client.sendInApp(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/in_app`, req.message));
  t.is(req.message.transactional_message_id, 1);
  t.deepEqual(req.message.identifiers, { id: '2' });
});

test('#sendInApp: with optional parameters: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendInAppRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
    message_data: { key: 'value' },
    disable_message_retention: true,
    queue_draft: true,
    send_at: 1234567890,
    language: 'en',
  });
  t.context.client.sendInApp(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/in_app`, req.message));
  t.is(req.message.transactional_message_id, 1);
  t.deepEqual(req.message.identifiers, { id: '2' });
  t.deepEqual(req.message.message_data, { key: 'value' });
  t.true(req.message.disable_message_retention);
  t.true(req.message.queue_draft);
  t.is(req.message.send_at, 1234567890);
  t.is(req.message.language, 'en');
});

test('#sendInApp: with email identifier: success', (t) => {
  sinon.stub(t.context.client.request, 'post');
  let req = new SendInAppRequest({
    identifiers: { email: 'test@example.com' },
    transactional_message_id: 1,
  });
  t.context.client.sendInApp(req);
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/in_app`, req.message));
  t.is(req.message.transactional_message_id, 1);
  t.deepEqual(req.message.identifiers, { email: 'test@example.com' });
});

test('#sendInApp: error', async (t) => {
  sinon.stub(t.context.client.request, 'post').rejects({ message: 'sample error', statusCode: 400 });

  let req = new SendInAppRequest({
    identifiers: { id: '2' },
    transactional_message_id: 1,
  });
  t.context.client.sendInApp(req).catch((err) => {
    t.is(err.message, 'sample error');
    t.is(err.statusCode, 400);
  });

  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/in_app`, req.message));
});

const ID_INPUTS: [string | number, string][] = [
  [1, '1'],
  ['2 ', encodeURIComponent('2 ')],
  ['3/', encodeURIComponent('3/')],
  ['%&*/test.#@!~', encodeURIComponent('%&*/test.#@!~')],
];

ID_INPUTS.forEach(([input, expected]) => {
  test(`#triggerBroadcast: encodes broadcastId ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'post');
    t.context.client.triggerBroadcast(input, { type: 'data' }, { type: 'recipients' });
    t.truthy(
      (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/campaigns/${expected}/triggers`, {
        data: { type: 'data' },
        recipients: { type: 'recipients' },
      }),
    );
  });

  test(`#getExport: encodes id ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'get');
    t.context.client.getExport(input);
    t.truthy((t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/${expected}`));
  });

  test(`#downloadExport: encodes id ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'get');
    t.context.client.downloadExport(input);
    t.truthy((t.context.client.request.get as SinonStub).calledWith(`${RegionUS.apiUrl}/exports/${expected}/download`));
  });

  test(`#getAttributes: encodes id ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'get');
    t.context.client.getAttributes(input as string);
    t.truthy(
      (t.context.client.request.get as SinonStub).calledWith(
        `${RegionUS.apiUrl}/customers/${expected}/attributes?id_type=id`,
      ),
    );
  });
});

test('sendEmail: cross-copy branded object passes instanceof check', (t) => {
  sinon.stub(t.context.client.request, 'post');

  const brand = Symbol.for('customerio-node.SendEmailRequest');
  const fakeCrossCopyReq = { message: { to: 'test@example.com', identifiers: { id: '2' }, attachments: {} } };
  Object.defineProperty(fakeCrossCopyReq, brand, { value: true });

  t.notThrows(() => t.context.client.sendEmail(fakeCrossCopyReq as any));
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.apiUrl}/send/email`, fakeCrossCopyReq.message),
  );
});

test('constructor: cross-copy branded Region passes instanceof check', (t) => {
  const brand = Symbol.for('customerio-node.Region');
  const fakeRegion = { trackUrl: 'https://track.example.com/api/v1', apiUrl: 'https://api.example.com/v1' };
  Object.defineProperty(fakeRegion, brand, { value: true });

  t.notThrows(() => new APIClient('appKey', { region: fakeRegion as any }));
});

// --- Batch 1: Customers & objects (CDP-6265) ---

const API = RegionUS.apiUrl;

test('#getCustomerActivities: requires customerId', (t) => {
  t.throws(() => (t.context.client.getCustomerActivities as any)(''), { message: 'customerId is required' });
});

test('#getCustomerActivities: validates idType', (t) => {
  t.throws(() => t.context.client.getCustomerActivities('1', { idType: 'nope' as any }), {
    message: 'idType must be one of "id", "cio_id", or "email"',
  });
});

test('#getCustomerActivities: no options omits the query string', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.getCustomerActivities('1');
  t.true(get.calledWith(`${API}/customers/1/activities`));
});

test('#getCustomerActivities: forwards filters as query params', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.getCustomerActivities('1', {
    idType: IdentifierType.Email,
    start: 'abc',
    limit: 50,
    type: 'event',
    name: 'signup',
  });
  t.true(get.calledWith(`${API}/customers/1/activities?id_type=email&start=abc&limit=50&type=event&name=signup`));
});

test('#getCustomerMessages: forwards timestamp filters', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.getCustomerMessages('1', { start_ts: 100, end_ts: 200, limit: 10 });
  t.true(get.calledWith(`${API}/customers/1/messages?limit=10&start_ts=100&end_ts=200`));
});

test('#getCustomerMessages: requires customerId and validates idType', (t) => {
  t.throws(() => (t.context.client.getCustomerMessages as any)(''), { message: 'customerId is required' });
  t.throws(() => t.context.client.getCustomerMessages('1', { idType: 'nope' as any }), {
    message: 'idType must be one of "id", "cio_id", or "email"',
  });
});

test('#getCustomerRelationships: paginates and requires customerId', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => (t.context.client.getCustomerRelationships as any)(''), { message: 'customerId is required' });
  t.context.client.getCustomerRelationships('1', { start: 'cur', limit: 5 });
  t.true(get.calledWith(`${API}/customers/1/relationships?start=cur&limit=5`));
});

test('#getCustomerSegments: defaults id_type to id and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => (t.context.client.getCustomerSegments as any)(''), { message: 'customerId is required' });
  t.throws(() => t.context.client.getCustomerSegments('1', 'nope' as any), {
    message: 'idType must be one of "id", "cio_id", or "email"',
  });
  t.context.client.getCustomerSegments('1');
  t.true(get.calledWith(`${API}/customers/1/segments?id_type=id`));
});

test('#getCustomerSubscriptionPreferences: forwards language and id_type', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => (t.context.client.getCustomerSubscriptionPreferences as any)(''), {
    message: 'customerId is required',
  });
  t.throws(() => t.context.client.getCustomerSubscriptionPreferences('1', { idType: 'nope' as any }), {
    message: 'idType must be one of "id", "cio_id", or "email"',
  });
  t.context.client.getCustomerSubscriptionPreferences('1', { idType: IdentifierType.CioId, language: 'es-ES' });
  t.true(get.calledWith(`${API}/customers/1/subscription_preferences?id_type=cio_id&language=es-ES`));
});

test('#searchCustomers: posts filter with pagination query', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  const filter: Filter = { and: [{ segment: { id: 7 } }] };
  t.throws(() => (t.context.client.searchCustomers as any)(null), { message: 'filter is required' });
  t.context.client.searchCustomers(filter, { limit: 100 });
  t.true(post.calledWith(`${API}/customers?limit=100`, { filter }));
});

test('#getCustomersAttributes: posts a non-empty ids array', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.getCustomersAttributes([]), { message: 'ids is required' });
  t.throws(() => (t.context.client.getCustomersAttributes as any)('1'), { message: 'ids is required' });
  t.context.client.getCustomersAttributes(['1', '2']);
  t.true(post.calledWith(`${API}/customers/attributes`, { ids: ['1', '2'] }));
});

test('#getObjectAttributes: builds the object path and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getObjectAttributes('', 'acme'), { message: 'objectTypeId is required' });
  t.throws(() => t.context.client.getObjectAttributes(1, ''), { message: 'objectId is required' });
  t.throws(() => t.context.client.getObjectAttributes(1, 'acme', 'id' as any), {
    message: 'idType must be one of "object_id" or "cio_object_id"',
  });
  t.context.client.getObjectAttributes(1, 'acme', 'cio_object_id');
  t.true(get.calledWith(`${API}/objects/1/acme/attributes?id_type=cio_object_id`));
});

test('#getObjectRelationships: paginates the object relationships path', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getObjectRelationships('', 'acme'), { message: 'objectTypeId is required' });
  t.throws(() => t.context.client.getObjectRelationships(1, ''), { message: 'objectId is required' });
  t.throws(() => t.context.client.getObjectRelationships(1, 'acme', { idType: 'id' as any }), {
    message: 'idType must be one of "object_id" or "cio_object_id"',
  });
  t.context.client.getObjectRelationships(1, 'acme', { idType: 'object_id', start: 'c', limit: 20 });
  t.true(get.calledWith(`${API}/objects/1/acme/relationships?id_type=object_id&start=c&limit=20`));
});

test('#findObjects: posts object_type_id + filter with pagination', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  const filter = { and: [{ object_attribute: { field: 'name', operator: 'eq', value: 'acme', type_id: 1 } }] };
  t.throws(() => t.context.client.findObjects('', filter), { message: 'objectTypeId is required' });
  t.throws(() => (t.context.client.findObjects as any)(1, null), { message: 'filter is required' });
  t.context.client.findObjects(1, filter, { start: 'c' });
  t.true(post.calledWith(`${API}/objects?start=c`, { object_type_id: 1, filter }));
});

test('#listObjectTypes: gets the object_types endpoint', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listObjectTypes();
  t.true(get.calledWith(`${API}/object_types`));
});

test('#listActivities: forwards filters and validates idType', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.listActivities({ idType: 'nope' as any }), {
    message: 'idType must be one of "id", "cio_id", or "email"',
  });
  t.context.client.listActivities({ type: 'event', deleted: true, customerId: '1', idType: IdentifierType.Id });
  t.true(get.calledWith(`${API}/activities?type=event&deleted=true&customer_id=1&id_type=id`));
});

test('#listActivities: no options omits the query string', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listActivities();
  t.true(get.calledWith(`${API}/activities`));
});

// --- Batch 2: Segments & subscriptions (CDP-6266) ---

test('#listSegments: gets the segments endpoint', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listSegments();
  t.true(get.calledWith(`${API}/segments`));
});

test('#createSegment: posts a segment wrapped under `segment`', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.throws(() => (t.context.client.createSegment as any)(null), { message: 'segment is required' });
  t.throws(() => (t.context.client.createSegment as any)('nope'), { message: 'segment is required' });
  t.throws(() => (t.context.client.createSegment as any)({}), { message: 'segment.name is required' });
  t.context.client.createSegment({ name: 'VIPs', description: 'high value' });
  t.true(post.calledWith(`${API}/segments`, { segment: { name: 'VIPs', description: 'high value' } }));
});

test('#getSegment: gets a single segment and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getSegment(''), { message: 'segmentId is required' });
  t.context.client.getSegment(7);
  t.true(get.calledWith(`${API}/segments/7`));
});

test('#deleteSegment: deletes a segment and validates', (t) => {
  const destroy = sinon.stub(t.context.client.request, 'destroy');
  t.throws(() => t.context.client.deleteSegment(''), { message: 'segmentId is required' });
  t.context.client.deleteSegment(7);
  t.true(destroy.calledWith(`${API}/segments/7`));
});

test('#getSegmentCustomerCount: gets the count endpoint and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getSegmentCustomerCount(''), { message: 'segmentId is required' });
  t.context.client.getSegmentCustomerCount(7);
  t.true(get.calledWith(`${API}/segments/7/customer_count`));
});

test('#getSegmentMembership: paginates the membership endpoint', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getSegmentMembership(''), { message: 'segmentId is required' });
  t.context.client.getSegmentMembership(7, { start: 'cur', limit: 50 });
  t.true(get.calledWith(`${API}/segments/7/membership?start=cur&limit=50`));
});

test('#getSegmentMembership: omits the query string with no options', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.getSegmentMembership(7);
  t.true(get.calledWith(`${API}/segments/7/membership`));
});

test('#getSegmentUsedBy: gets the used_by endpoint and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getSegmentUsedBy(''), { message: 'segmentId is required' });
  t.context.client.getSegmentUsedBy(7);
  t.true(get.calledWith(`${API}/segments/7/used_by`));
});

test('#listSubscriptionTopics: gets the subscription_topics endpoint', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listSubscriptionTopics();
  t.true(get.calledWith(`${API}/subscription_topics`));
});

test('#listSubscriptionChannels: gets the subscription_channels endpoint', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listSubscriptionChannels();
  t.true(get.calledWith(`${API}/subscription_channels`));
});

test('#getSubscriptionCenterToken: gets the token endpoint and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getSubscriptionCenterToken(''), { message: 'customerId is required' });
  t.context.client.getSubscriptionCenterToken('1');
  t.true(get.calledWith(`${API}/subscription_center/1/token`));
});

// --- Batch 3: Transactional message management (CDP-6267) ---

test('#listTransactionalMessages: gets the transactional endpoint', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listTransactionalMessages();
  t.true(get.calledWith(`${API}/transactional`));
});

test('#getTransactionalMessage: gets one message and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getTransactionalMessage(''), { message: 'transactionalId is required' });
  t.context.client.getTransactionalMessage(3);
  t.true(get.calledWith(`${API}/transactional/3`));
});

test('#getTransactionalMessageContents: gets the contents endpoint and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getTransactionalMessageContents(''), { message: 'transactionalId is required' });
  t.context.client.getTransactionalMessageContents(3);
  t.true(get.calledWith(`${API}/transactional/3/contents`));
});

test('#getTransactionalMessageLanguage: gets a translation and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getTransactionalMessageLanguage('', 'en'), {
    message: 'transactionalId is required',
  });
  t.throws(() => t.context.client.getTransactionalMessageLanguage(3, ''), { message: 'language is required' });
  t.context.client.getTransactionalMessageLanguage(3, 'en-US');
  t.true(get.calledWith(`${API}/transactional/3/language/en-US`));
});

test('#updateTransactionalMessageLanguage: puts the translation body and validates', (t) => {
  const put = sinon.stub(t.context.client.request, 'put');
  t.throws(() => t.context.client.updateTransactionalMessageLanguage('', 'en', {}), {
    message: 'transactionalId is required',
  });
  t.throws(() => t.context.client.updateTransactionalMessageLanguage(3, '', {}), { message: 'language is required' });
  t.context.client.updateTransactionalMessageLanguage(3, 'en-US', { subject: 'Hi' });
  t.true(put.calledWith(`${API}/transactional/3/language/en-US`, { subject: 'Hi' }));
  t.context.client.updateTransactionalMessageLanguage(3, 'fr');
  t.true(put.calledWith(`${API}/transactional/3/language/fr`, {}));
});

test('#getTransactionalMessageDeliveries: forwards filters and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getTransactionalMessageDeliveries(''), { message: 'transactionalId is required' });
  t.context.client.getTransactionalMessageDeliveries(3, {
    metric: 'delivered',
    state: 'sent',
    limit: 50,
    start_ts: 100,
    end_ts: 200,
    get_tracked_responses: true,
  });
  t.true(
    get.calledWith(
      `${API}/transactional/3/messages?limit=50&metric=delivered&state=sent&start_ts=100&end_ts=200&get_tracked_responses=true`,
    ),
  );
});

test('#getTransactionalMessageDeliveries: omits the query string with no options', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.getTransactionalMessageDeliveries(3);
  t.true(get.calledWith(`${API}/transactional/3/messages`));
});

test('#getTransactionalMessageMetrics: forwards period/steps and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getTransactionalMessageMetrics(''), { message: 'transactionalId is required' });
  t.context.client.getTransactionalMessageMetrics(3, { period: 'days', steps: 14 });
  t.true(get.calledWith(`${API}/transactional/3/metrics?period=days&steps=14`));
});

test('#getTransactionalMessageLinkMetrics: forwards unique and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getTransactionalMessageLinkMetrics(''), {
    message: 'transactionalId is required',
  });
  t.context.client.getTransactionalMessageLinkMetrics(3, { period: 'weeks', steps: 4, unique: true });
  t.true(get.calledWith(`${API}/transactional/3/metrics/links?period=weeks&steps=4&unique=true`));
});

test('#updateTransactionalMessageContent: puts the content body and validates', (t) => {
  const put = sinon.stub(t.context.client.request, 'put');
  t.throws(() => t.context.client.updateTransactionalMessageContent('', 5, {}), {
    message: 'transactionalId is required',
  });
  t.throws(() => t.context.client.updateTransactionalMessageContent(3, '', {}), { message: 'contentId is required' });
  t.context.client.updateTransactionalMessageContent(3, 5, { body: 'Updated' });
  t.true(put.calledWith(`${API}/transactional/3/content/5`, { body: 'Updated' }));
  t.context.client.updateTransactionalMessageContent(3, 6);
  t.true(put.calledWith(`${API}/transactional/3/content/6`, {}));
});

// --- Batch 4: Campaigns (CDP-6268) ---

test('#listCampaigns: gets the campaigns endpoint', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listCampaigns();
  t.true(get.calledWith(`${API}/campaigns`));
});

test('#getCampaign: gets one campaign and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaign(''), { message: 'campaignId is required' });
  t.context.client.getCampaign(9);
  t.true(get.calledWith(`${API}/campaigns/9`));
});

test('#getCampaignActions: lists actions with optional start', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignActions(''), { message: 'campaignId is required' });
  t.context.client.getCampaignActions(9);
  t.true(get.calledWith(`${API}/campaigns/9/actions`));
  t.context.client.getCampaignActions(9, { start: 'cur' });
  t.true(get.calledWith(`${API}/campaigns/9/actions?start=cur`));
});

test('#getCampaignAction: gets one action and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignAction('', 2), { message: 'campaignId is required' });
  t.throws(() => t.context.client.getCampaignAction(9, ''), { message: 'actionId is required' });
  t.context.client.getCampaignAction(9, 2);
  t.true(get.calledWith(`${API}/campaigns/9/actions/2`));
});

test('#updateCampaignAction: puts the body and validates', (t) => {
  const put = sinon.stub(t.context.client.request, 'put');
  t.throws(() => t.context.client.updateCampaignAction('', 2, {}), { message: 'campaignId is required' });
  t.throws(() => t.context.client.updateCampaignAction(9, '', {}), { message: 'actionId is required' });
  t.context.client.updateCampaignAction(9, 2, { body: 'x' });
  t.true(put.calledWith(`${API}/campaigns/9/actions/2`, { body: 'x' }));
  t.context.client.updateCampaignAction(9, 2);
  t.true(put.calledWith(`${API}/campaigns/9/actions/2`, {}));
});

test('#getCampaignActionLanguage: gets a translation and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignActionLanguage('', 2, 'en'), { message: 'campaignId is required' });
  t.throws(() => t.context.client.getCampaignActionLanguage(9, '', 'en'), { message: 'actionId is required' });
  t.throws(() => t.context.client.getCampaignActionLanguage(9, 2, ''), { message: 'language is required' });
  t.context.client.getCampaignActionLanguage(9, 2, 'en-US');
  t.true(get.calledWith(`${API}/campaigns/9/actions/2/language/en-US`));
});

test('#updateCampaignActionLanguage: puts the translation and validates', (t) => {
  const put = sinon.stub(t.context.client.request, 'put');
  t.throws(() => t.context.client.updateCampaignActionLanguage('', 2, 'en', {}), {
    message: 'campaignId is required',
  });
  t.throws(() => t.context.client.updateCampaignActionLanguage(9, '', 'en', {}), { message: 'actionId is required' });
  t.throws(() => t.context.client.updateCampaignActionLanguage(9, 2, '', {}), { message: 'language is required' });
  t.context.client.updateCampaignActionLanguage(9, 2, 'fr', { subject: 'Bonjour' });
  t.true(put.calledWith(`${API}/campaigns/9/actions/2/language/fr`, { subject: 'Bonjour' }));
  t.context.client.updateCampaignActionLanguage(9, 2, 'fr');
  t.true(put.calledWith(`${API}/campaigns/9/actions/2/language/fr`, {}));
});

test('#getCampaignActionMetrics: forwards version + options and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignActionMetrics('', 2, '1'), { message: 'campaignId is required' });
  t.throws(() => t.context.client.getCampaignActionMetrics(9, '', '1'), { message: 'actionId is required' });
  t.throws(() => t.context.client.getCampaignActionMetrics(9, 2, '' as any), { message: 'version is required' });
  t.context.client.getCampaignActionMetrics(9, 2, '2', { type: 'email', period: 'days', steps: 7 });
  t.true(get.calledWith(`${API}/campaigns/9/actions/2/metrics?version=2&type=email&period=days&steps=7`));
});

test('#getCampaignActionMetricsLinks: forwards type and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignActionMetricsLinks('', 2), { message: 'campaignId is required' });
  t.throws(() => t.context.client.getCampaignActionMetricsLinks(9, ''), { message: 'actionId is required' });
  t.context.client.getCampaignActionMetricsLinks(9, 2, { period: 'weeks', steps: 4, type: 'push' });
  t.true(get.calledWith(`${API}/campaigns/9/actions/2/metrics/links?period=weeks&steps=4&type=push`));
});

test('#getCampaignMetrics: forwards version + options and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignMetrics('', '1'), { message: 'campaignId is required' });
  t.throws(() => t.context.client.getCampaignMetrics(9, '' as any), { message: 'version is required' });
  t.context.client.getCampaignMetrics(9, '1', { res: 'daily', tz: 'America/New_York', start: 100, end: 200 });
  t.true(get.calledWith(`${API}/campaigns/9/metrics?version=1&res=daily&tz=America%2FNew_York&start=100&end=200`));
});

test('#getCampaignMetricsLinks: forwards unique and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignMetricsLinks(''), { message: 'campaignId is required' });
  t.context.client.getCampaignMetricsLinks(9, { period: 'days', steps: 30, unique: true });
  t.true(get.calledWith(`${API}/campaigns/9/metrics/links?period=days&steps=30&unique=true`));
});

test('#getCampaignJourneyMetrics: requires window + resolution', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignJourneyMetrics('', { start: 1, end: 2, res: 'days' }), {
    message: 'campaignId is required',
  });
  t.throws(() => (t.context.client.getCampaignJourneyMetrics as any)(9, null), {
    message: 'options.start is required',
  });
  t.throws(() => (t.context.client.getCampaignJourneyMetrics as any)(9, { end: 2, res: 'days' }), {
    message: 'options.start is required',
  });
  t.throws(() => (t.context.client.getCampaignJourneyMetrics as any)(9, { start: 1, res: 'days' }), {
    message: 'options.end is required',
  });
  t.throws(() => (t.context.client.getCampaignJourneyMetrics as any)(9, { start: 1, end: 2 }), {
    message: 'options.res is required',
  });
  t.context.client.getCampaignJourneyMetrics(9, { start: 100, end: 200, res: 'daily' });
  t.true(get.calledWith(`${API}/campaigns/9/journey_metrics?start=100&end=200&res=daily`));
});

test('#getCampaignMessages: forwards filters and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getCampaignMessages(''), { message: 'campaignId is required' });
  t.context.client.getCampaignMessages(9, { type: 'email', metric: 'delivered', drafts: true, limit: 50 });
  t.true(get.calledWith(`${API}/campaigns/9/messages?limit=50&type=email&metric=delivered&drafts=true`));
});

test('#getBroadcastTriggerStatus: gets the trigger status and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastTriggerStatus('', 5), { message: 'broadcastId is required' });
  t.throws(() => t.context.client.getBroadcastTriggerStatus(1, ''), { message: 'triggerId is required' });
  t.context.client.getBroadcastTriggerStatus(1, 5);
  t.true(get.calledWith(`${API}/campaigns/1/triggers/5`));
});

test('#getBroadcastTriggerErrors: paginates and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastTriggerErrors('', 5), { message: 'broadcastId is required' });
  t.throws(() => t.context.client.getBroadcastTriggerErrors(1, ''), { message: 'triggerId is required' });
  t.context.client.getBroadcastTriggerErrors(1, 5, { start: 'c', limit: 10 });
  t.true(get.calledWith(`${API}/campaigns/1/triggers/5/errors?start=c&limit=10`));
});

// --- Batch 5: Broadcasts (CDP-6269) ---

test('#listBroadcasts: gets the broadcasts endpoint', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listBroadcasts();
  t.true(get.calledWith(`${API}/broadcasts`));
});

test('#getBroadcast: gets one broadcast and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcast(''), { message: 'broadcastId is required' });
  t.context.client.getBroadcast(4);
  t.true(get.calledWith(`${API}/broadcasts/4`));
});

test('#getBroadcastActions: lists actions and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastActions(''), { message: 'broadcastId is required' });
  t.context.client.getBroadcastActions(4);
  t.true(get.calledWith(`${API}/broadcasts/4/actions`));
});

test('#getBroadcastAction: gets one action and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastAction('', 2), { message: 'broadcastId is required' });
  t.throws(() => t.context.client.getBroadcastAction(4, ''), { message: 'actionId is required' });
  t.context.client.getBroadcastAction(4, 2);
  t.true(get.calledWith(`${API}/broadcasts/4/actions/2`));
});

test('#updateBroadcastAction: puts the body and validates', (t) => {
  const put = sinon.stub(t.context.client.request, 'put');
  t.throws(() => t.context.client.updateBroadcastAction('', 2, {}), { message: 'broadcastId is required' });
  t.throws(() => t.context.client.updateBroadcastAction(4, '', {}), { message: 'actionId is required' });
  t.context.client.updateBroadcastAction(4, 2, { body: 'x' });
  t.true(put.calledWith(`${API}/broadcasts/4/actions/2`, { body: 'x' }));
  t.context.client.updateBroadcastAction(4, 2);
  t.true(put.calledWith(`${API}/broadcasts/4/actions/2`, {}));
});

test('#getBroadcastActionLanguage: gets a translation and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastActionLanguage('', 2, 'en'), { message: 'broadcastId is required' });
  t.throws(() => t.context.client.getBroadcastActionLanguage(4, '', 'en'), { message: 'actionId is required' });
  t.throws(() => t.context.client.getBroadcastActionLanguage(4, 2, ''), { message: 'language is required' });
  t.context.client.getBroadcastActionLanguage(4, 2, 'en-US');
  t.true(get.calledWith(`${API}/broadcasts/4/actions/2/language/en-US`));
});

test('#updateBroadcastActionLanguage: puts the translation and validates', (t) => {
  const put = sinon.stub(t.context.client.request, 'put');
  t.throws(() => t.context.client.updateBroadcastActionLanguage('', 2, 'en', {}), {
    message: 'broadcastId is required',
  });
  t.throws(() => t.context.client.updateBroadcastActionLanguage(4, '', 'en', {}), { message: 'actionId is required' });
  t.throws(() => t.context.client.updateBroadcastActionLanguage(4, 2, '', {}), { message: 'language is required' });
  t.context.client.updateBroadcastActionLanguage(4, 2, 'fr', { subject: 'Bonjour' });
  t.true(put.calledWith(`${API}/broadcasts/4/actions/2/language/fr`, { subject: 'Bonjour' }));
  t.context.client.updateBroadcastActionLanguage(4, 2, 'fr');
  t.true(put.calledWith(`${API}/broadcasts/4/actions/2/language/fr`, {}));
});

test('#getBroadcastActionMetrics: forwards options and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastActionMetrics('', 2), { message: 'broadcastId is required' });
  t.throws(() => t.context.client.getBroadcastActionMetrics(4, ''), { message: 'actionId is required' });
  t.context.client.getBroadcastActionMetrics(4, 2, { period: 'days', steps: 7, type: 'email' });
  t.true(get.calledWith(`${API}/broadcasts/4/actions/2/metrics?period=days&steps=7&type=email`));
});

test('#getBroadcastActionMetricsLinks: forwards options and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastActionMetricsLinks('', 2), { message: 'broadcastId is required' });
  t.throws(() => t.context.client.getBroadcastActionMetricsLinks(4, ''), { message: 'actionId is required' });
  t.context.client.getBroadcastActionMetricsLinks(4, 2, { period: 'weeks', steps: 4, type: 'push' });
  t.true(get.calledWith(`${API}/broadcasts/4/actions/2/metrics/links?period=weeks&steps=4&type=push`));
});

test('#getBroadcastMetrics: forwards options and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastMetrics(''), { message: 'broadcastId is required' });
  t.context.client.getBroadcastMetrics(4, { period: 'days', steps: 30, type: 'email' });
  t.true(get.calledWith(`${API}/broadcasts/4/metrics?period=days&steps=30&type=email`));
});

test('#getBroadcastMetricsLinks: forwards unique and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastMetricsLinks(''), { message: 'broadcastId is required' });
  t.context.client.getBroadcastMetricsLinks(4, { period: 'days', steps: 30, unique: true });
  t.true(get.calledWith(`${API}/broadcasts/4/metrics/links?period=days&steps=30&unique=true`));
});

test('#getBroadcastMessages: forwards filters and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastMessages(''), { message: 'broadcastId is required' });
  t.context.client.getBroadcastMessages(4, { metric: 'delivered', state: 'sent', type: 'email', limit: 50 });
  t.true(get.calledWith(`${API}/broadcasts/4/messages?limit=50&metric=delivered&state=sent&type=email`));
});

test('#getBroadcastTriggers: gets the triggers endpoint and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getBroadcastTriggers(''), { message: 'broadcastId is required' });
  t.context.client.getBroadcastTriggers(4);
  t.true(get.calledWith(`${API}/broadcasts/4/triggers`));
});

// --- Batch 6: Newsletters — core (CDP-6270) ---

test('#listNewsletters: forwards pagination + sort', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.context.client.listNewsletters();
  t.true(get.calledWith(`${API}/newsletters`));
  t.context.client.listNewsletters({ start: 'c', limit: 25, sort: 'desc' });
  t.true(get.calledWith(`${API}/newsletters?start=c&limit=25&sort=desc`));
});

test('#createNewsletter: posts the body', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.context.client.createNewsletter({ name: 'Weekly' });
  t.true(post.calledWith(`${API}/newsletters`, { name: 'Weekly' }));
  t.context.client.createNewsletter();
  t.true(post.calledWith(`${API}/newsletters`, {}));
});

test('#getNewsletter: gets one and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getNewsletter(''), { message: 'newsletterId is required' });
  t.context.client.getNewsletter(8);
  t.true(get.calledWith(`${API}/newsletters/8`));
});

test('#deleteNewsletter: deletes and validates', (t) => {
  const destroy = sinon.stub(t.context.client.request, 'destroy');
  t.throws(() => t.context.client.deleteNewsletter(''), { message: 'newsletterId is required' });
  t.context.client.deleteNewsletter(8);
  t.true(destroy.calledWith(`${API}/newsletters/8`));
});

test('#getNewsletterContents: lists contents and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getNewsletterContents(''), { message: 'newsletterId is required' });
  t.context.client.getNewsletterContents(8);
  t.true(get.calledWith(`${API}/newsletters/8/contents`));
});

test('#getNewsletterContent: gets one content and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getNewsletterContent('', 3), { message: 'newsletterId is required' });
  t.throws(() => t.context.client.getNewsletterContent(8, ''), { message: 'contentId is required' });
  t.context.client.getNewsletterContent(8, 3);
  t.true(get.calledWith(`${API}/newsletters/8/contents/3`));
});

test('#updateNewsletterContent: puts the body and validates', (t) => {
  const put = sinon.stub(t.context.client.request, 'put');
  t.throws(() => t.context.client.updateNewsletterContent('', 3, {}), { message: 'newsletterId is required' });
  t.throws(() => t.context.client.updateNewsletterContent(8, '', {}), { message: 'contentId is required' });
  t.context.client.updateNewsletterContent(8, 3, { subject: 'Hi' });
  t.true(put.calledWith(`${API}/newsletters/8/contents/3`, { subject: 'Hi' }));
  t.context.client.updateNewsletterContent(8, 3);
  t.true(put.calledWith(`${API}/newsletters/8/contents/3`, {}));
});

test('#getNewsletterContentMetrics: forwards options and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getNewsletterContentMetrics('', 3), { message: 'newsletterId is required' });
  t.throws(() => t.context.client.getNewsletterContentMetrics(8, ''), { message: 'contentId is required' });
  t.context.client.getNewsletterContentMetrics(8, 3, { period: 'days', steps: 7, type: 'inbox' });
  t.true(get.calledWith(`${API}/newsletters/8/contents/3/metrics?period=days&steps=7&type=inbox`));
});

test('#getNewsletterContentMetricsLinks: forwards options and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getNewsletterContentMetricsLinks('', 3), { message: 'newsletterId is required' });
  t.throws(() => t.context.client.getNewsletterContentMetricsLinks(8, ''), { message: 'contentId is required' });
  t.context.client.getNewsletterContentMetricsLinks(8, 3, { period: 'weeks', steps: 4, type: 'email' });
  t.true(get.calledWith(`${API}/newsletters/8/contents/3/metrics/links?period=weeks&steps=4&type=email`));
});

test('#getNewsletterMetrics: forwards options and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getNewsletterMetrics(''), { message: 'newsletterId is required' });
  t.context.client.getNewsletterMetrics(8, { period: 'days', steps: 30, type: 'email' });
  t.true(get.calledWith(`${API}/newsletters/8/metrics?period=days&steps=30&type=email`));
});

test('#getNewsletterMetricsLinks: forwards unique and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getNewsletterMetricsLinks(''), { message: 'newsletterId is required' });
  t.context.client.getNewsletterMetricsLinks(8, { period: 'days', steps: 30, unique: true });
  t.true(get.calledWith(`${API}/newsletters/8/metrics/links?period=days&steps=30&unique=true`));
});

test('#getNewsletterMessages: forwards filters and validates', (t) => {
  const get = sinon.stub(t.context.client.request, 'get');
  t.throws(() => t.context.client.getNewsletterMessages(''), { message: 'newsletterId is required' });
  t.context.client.getNewsletterMessages(8, { metric: 'delivered', limit: 50, get_tracked_responses: true });
  t.true(get.calledWith(`${API}/newsletters/8/messages?limit=50&metric=delivered&get_tracked_responses=true`));
});

test('#sendNewsletter: posts send settings and validates', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.sendNewsletter(''), { message: 'newsletterId is required' });
  t.context.client.sendNewsletter(8, { rate_limit_email_rate: 100 });
  t.true(post.calledWith(`${API}/newsletters/8/send`, { rate_limit_email_rate: 100 }));
  t.context.client.sendNewsletter(8);
  t.true(post.calledWith(`${API}/newsletters/8/send`, {}));
});

test('#scheduleNewsletter: posts schedule settings and validates', (t) => {
  const post = sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.scheduleNewsletter(''), { message: 'newsletterId is required' });
  t.context.client.scheduleNewsletter(8, { timestamp: 1719792000 });
  t.true(post.calledWith(`${API}/newsletters/8/schedule`, { timestamp: 1719792000 }));
  t.context.client.scheduleNewsletter(8);
  t.true(post.calledWith(`${API}/newsletters/8/schedule`, {}));
});
