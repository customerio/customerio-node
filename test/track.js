const test = require('ava');
const sinon = require('sinon');
const CIO = require('../lib');

const trackRoot = 'https://track.customer.io/api/v1';
const apiRoot = 'https://api.customer.io/v1/api';

test.beforeEach((t) => {
  t.context.client = new CIO(123, 'abc');
});

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.siteid, 123);
  t.is(t.context.client.apikey, 'abc');
  t.truthy(t.context.client.request);
  t.is(t.context.client.request.siteid, 123);
  t.is(t.context.client.request.apikey, 'abc');
});

test('#identify works', (t) => {
  sinon.stub(t.context.client.request, 'put');
  t.throws(() => t.context.client.identify(''), 'customerId is required');

  [
    [1, '1'],
    ['1 ', encodeURIComponent('1 ')],
    ['1/', encodeURIComponent('1/')],
  ].forEach(([input, expected]) => {
    t.context.client.identify(input);
    t.truthy(t.context.client.request.put.calledWith(`${trackRoot}/customers/${expected}`, {}));
  });
});

test('#destroy works', (t) => {
  sinon.stub(t.context.client.request, 'destroy');
  t.throws(() => t.context.client.destroy(''), 'customerId is required');

  [
    [1, '1'],
    ['1 ', encodeURIComponent('1 ')],
    ['1/', encodeURIComponent('1/')],
  ].forEach(([input, expected]) => {
    t.context.client.destroy(input);
    t.truthy(t.context.client.request.destroy.calledWith(`${trackRoot}/customers/${expected}`));
  });
});

test('#suppress works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.suppress(''), 'customerId is required');

  [
    [1, '1'],
    ['1 ', encodeURIComponent('1 ')],
    ['1/', encodeURIComponent('1/')],
  ].forEach(([input, expected]) => {
    t.context.client.suppress(input);
    t.truthy(t.context.client.request.post.calledWith(`${trackRoot}/customers/${expected}/suppress`));
  });
});

test('#track with customer id works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.track(''), 'customerId is required');

  [
    [1, '1'],
    ['1 ', encodeURIComponent('1 ')],
    ['1/', encodeURIComponent('1/')],
  ].forEach(([input, expected]) => {
    t.throws(() => t.context.client.track(input, { data: {} }), 'data.name is required');
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
  t.throws(() => t.context.client.trackAnonymous({ data: {} }), 'data.name is required');
  t.context.client.trackAnonymous({ name: 'purchase', data: 'yep' });
  t.truthy(
    t.context.client.request.post.calledWith(`${trackRoot}/events`, {
      name: 'purchase',
      data: 'yep',
    }),
  );
});

test('#trackPageView works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.trackPageView(''), 'customerId is required');

  [
    [1, '1'],
    ['1 ', encodeURIComponent('1 ')],
    ['1/', encodeURIComponent('1/')],
  ].forEach(([input, expected]) => {
    t.throws(() => t.context.client.trackPageView(input, ''), 'path is required');
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

test('#addDevice works', (t) => {
  sinon.stub(t.context.client.request, 'put');

  [
    [1, '1'],
    ['1 ', encodeURIComponent('1 ')],
    ['1/', encodeURIComponent('1/')],
  ].forEach(([input, expected]) => {
    t.throws(() => t.context.client.addDevice(input, '', 'ios', { primary: true }), 'device_id is required');
    t.throws(() => t.context.client.addDevice(input, 123, '', { primary: true }), 'platform is required');

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
  t.throws(() => t.context.client.deleteDevice(''), 'customerId is required');
  t.throws(() => t.context.client.deleteDevice(1, ''), 'deviceToken is required');

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

test('#addToSegment works', (t) => {
  let ids = ['1', '2', '3'];
  sinon.stub(t.context.client.request, 'post');

  t.throws(() => t.context.client.addToSegment(''), 'segmentId is required');
  t.throws(() => t.context.client.addToSegment(1, []), 'customerIds is required');

  [
    [1, '1'],
    ['1 ', encodeURIComponent('1 ')],
    ['1/', encodeURIComponent('1/')],
  ].forEach(([input, expected]) => {
    t.context.client.addToSegment(input, ids);
    t.truthy(t.context.client.request.post.calledWith(`${trackRoot}/segments/${expected}/add_customers`, { ids }));
  });
});

test('#removeFromSegment works', (t) => {
  let ids = ['1', '2', '3'];
  sinon.stub(t.context.client.request, 'post');

  t.throws(() => t.context.client.removeFromSegment(''), 'segmentId is required');
  t.throws(() => t.context.client.removeFromSegment(1, []), 'customerIds is required');

  [
    [1, '1'],
    ['1 ', encodeURIComponent('1 ')],
    ['1/', encodeURIComponent('1/')],
  ].forEach(([input, expected]) => {
    t.context.client.removeFromSegment(input, ids);
    t.truthy(t.context.client.request.post.calledWith(`${trackRoot}/segments/${expected}/remove_customers`, { ids }));
  });
});
