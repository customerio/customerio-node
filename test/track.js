const test = require('ava');
const sinon = require('sinon');
const CIO = require('../track');

const trackRoot = 'https://track.customer.io/api/v1';
const apiRoot = 'https://api.customer.io/v1/api';

test.beforeEach((t) => {
  t.context.client = new CIO(123, 'abc');
});

const ID_INPUTS = Object.freeze([
  [1, '1'],
  ['2 ', encodeURIComponent('2 ')],
  ['3/', encodeURIComponent('3/')],
  ['%&*/test.#@!~', encodeURIComponent('%&*/test.#@!~')],
]);

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.siteid, 123);
  t.is(t.context.client.apikey, 'abc');
  t.truthy(t.context.client.request);
  t.is(t.context.client.request.siteid, 123);
  t.is(t.context.client.request.apikey, 'abc');
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#identify works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'put');
    t.throws(() => t.context.client.identify(''), { message: 'customerId is required' });

    t.context.client.identify(input);
    t.truthy(t.context.client.request.put.calledWith(`${trackRoot}/customers/${expected}`, {}));
  });
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#destroy works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'destroy');
    t.throws(() => t.context.client.destroy(''), { message: 'customerId is required' });

    t.context.client.destroy(input);
    t.truthy(t.context.client.request.destroy.calledWith(`${trackRoot}/customers/${expected}`));
  });
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#suppress works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'post');
    t.throws(() => t.context.client.suppress(''), { message: 'customerId is required' });

    t.context.client.suppress(input);
    t.truthy(t.context.client.request.post.calledWith(`${trackRoot}/customers/${expected}/suppress`));
  });
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#track with customer id works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'post');
    t.throws(() => t.context.client.track(''), { message: 'customerId is required' });

    t.throws(() => t.context.client.track(input, { data: {} }), { message: 'data.name is required' });
    t.context.client.track(input, { name: 'purchase', data: 'yep' });
    t.truthy(
      t.context.client.request.post.calledWith(`${trackRoot}/customers/${expected}/events`, {
        name: 'purchase',
        data: 'yep',
      }),
    );
  });
});

test('#trackAnonymous works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.trackAnonymous({ data: {} }), { message: 'data.name is required' });
  t.context.client.trackAnonymous({ name: 'purchase', data: 'yep' });
  t.truthy(
    t.context.client.request.post.calledWith(`${trackRoot}/events`, {
      name: 'purchase',
      data: 'yep',
    }),
  );
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#trackPageView works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'post');
    t.throws(() => t.context.client.trackPageView(''), { message: 'customerId is required' });

    t.throws(() => t.context.client.trackPageView(input, ''), { message: 'path is required' });
    t.context.client.trackPageView(input, '#home');
    t.truthy(
      t.context.client.request.post.calledWith(`${trackRoot}/customers/${expected}/events`, {
        type: 'page',
        name: '#home',
      }),
    );
  });
});

test('#triggerBroadcast works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.triggerBroadcast(1, { type: 'data' }, { type: 'recipients' });
  t.truthy(
    t.context.client.request.post.calledWith(`${apiRoot}/campaigns/1/triggers`, {
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
    t.context.client.request.post.calledWith(`${apiRoot}/campaigns/1/triggers`, {
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
    t.context.client.request.post.calledWith(`${apiRoot}/campaigns/1/triggers`, {
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
    t.context.client.request.post.calledWith(`${apiRoot}/campaigns/1/triggers`, {
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
    t.context.client.request.post.calledWith(`${apiRoot}/campaigns/1/triggers`, {
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
    t.context.client.request.post.calledWith(`${apiRoot}/campaigns/1/triggers`, {
      data: { type: 'data' },
      ids: [1],
      id_ignore_missing: true,
    }),
  );
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#addDevice works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'put');

    t.throws(() => t.context.client.addDevice(input, '', 'ios', { primary: true }), {
      message: 'device_id is required',
    });
    t.throws(() => t.context.client.addDevice(input, 123, '', { primary: true }), { message: 'platform is required' });

    t.context.client.addDevice(input, 123, 'ios', { primary: true });
    t.truthy(
      t.context.client.request.put.calledWith(`${trackRoot}/customers/${expected}/devices`, {
        device: {
          id: 123,
          platform: 'ios',
          primary: true,
        },
      }),
    );
  });
});

test('#addDevice works with an empty data parameter', (t) => {
  sinon.stub(t.context.client.request, 'put');
  t.context.client.addDevice(1, 123, 'ios', null);
  t.truthy(
    t.context.client.request.put.calledWith(`${trackRoot}/customers/1/devices`, {
      device: {
        id: 123,
        platform: 'ios',
      },
    }),
  );
});

test('#deleteDevice works', (t) => {
  sinon.stub(t.context.client.request, 'destroy');
  t.throws(() => t.context.client.deleteDevice(''), { message: 'customerId is required' });
  t.throws(() => t.context.client.deleteDevice(1, ''), { message: 'deviceToken is required' });

  [
    [
      [1, '1'],
      ['abc123', 'abc123'],
    ],
    [
      ['1 ', encodeURIComponent('1 ')],
      ['abc:123 ', encodeURIComponent('abc:123 ')],
    ],
    [
      ['1/', encodeURIComponent('1/')],
      ['1/2==', encodeURIComponent('1/2==')],
    ],
  ].forEach(([[customerId, encodedCustomerId], [token, encodedToken]]) => {
    t.context.client.deleteDevice(customerId, token);
    t.truthy(
      t.context.client.request.destroy.calledWith(
        `${trackRoot}/customers/${encodedCustomerId}/devices/${encodedToken}`,
      ),
    );
  });
});
