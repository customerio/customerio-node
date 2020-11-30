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
  t.context.client.identify(1);
  t.truthy(t.context.client.request.put.calledWith(`${trackRoot}/customers/1`, {}));
});

test('#destroy works', (t) => {
  sinon.stub(t.context.client.request, 'destroy');
  t.context.client.destroy(1);
  t.truthy(t.context.client.request.destroy.calledWith(`${trackRoot}/customers/1`));
});

test('#suppress works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.suppress(1);
  t.truthy(t.context.client.request.post.calledWith(`${trackRoot}/customers/1/suppress`));
});

test('#track with customer id works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.track(1, { data: 'yep' });
  t.truthy(
    t.context.client.request.post.calledWith(`${trackRoot}/customers/1/events`, {
      data: 'yep',
    }),
  );
});

test('#trackAnonymous works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.trackAnonymous({ data: 'yep' });
  t.truthy(
    t.context.client.request.post.calledWith(`${trackRoot}/events`, {
      data: 'yep',
    }),
  );
});

test('#trackPageView works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.trackPageView(1, '#home');
  t.truthy(
    t.context.client.request.post.calledWith(`${trackRoot}/customers/1/events`, {
      type: 'page',
      name: '#home',
    }),
  );
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
    { emails: ['test@email.com'], email_ignore_missing: true, email_add_duplicates: true },
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
    t.context.client.request.post.calledWith(
      `${apiRoot}/campaigns/1/triggers`,
      {
        data: { type: 'data' },
        ids: [1],
        id_ignore_missing: true,
      }
    )
  )
})

test('#triggerBroadcast works with per_user_data', t => {
  sinon.stub(t.context.client.request, 'post')
  const per_user_data = [ { id: 1, data: { very: 'important' }} ]
  t.context.client.triggerBroadcast(1, { type: 'data' }, { per_user_data, id_ignore_missing: true })
  t.truthy(
    t.context.client.request.post.calledWith(
      `${apiRoot}/campaigns/1/triggers`,
      {
        data: { type: 'data' },
        per_user_data,
        id_ignore_missing: true,
      }
    )
  )
})

test('#triggerBroadcast works with data_file_url', t => {
  sinon.stub(t.context.client.request, 'post')
  const data_file_url = 'https://my.s3.bucket.com'
  t.context.client.triggerBroadcast(1, { type: 'data' }, { data_file_url, id_ignore_missing: true })
  t.truthy(
    t.context.client.request.post.calledWith(
      `${apiRoot}/campaigns/1/triggers`,
      {
        data: { type: 'data' },
        data_file_url,
        id_ignore_missing: true,
      }
    )
  )
})

test('#triggerBroadcast discards extraneous fields', t => {
  sinon.stub(t.context.client.request, 'post')
  t.context.client.triggerBroadcast(1, { type: 'data' }, { ids: [1], id_ignore_missing: true, emails: ['test@email.com'], exampleField: true })
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
  t.context.client.addDevice(1, 123, 'ios', { primary: true });
  t.truthy(
    t.context.client.request.put.calledWith(`${trackRoot}/customers/1/devices`, {
      device: {
        id: 123,
        platform: 'ios',
        primary: true,
      },
    }),
  );
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
  t.context.client.deleteDevice(1, 123);
  t.truthy(t.context.client.request.destroy.calledWith(`${trackRoot}/customers/1/devices/123`));
});

test('#addToSegment works', (t) => {
  let ids = ['1', '2', '3'];

  sinon.stub(t.context.client.request, 'post');
  t.context.client.addToSegment(1, ids);

  t.truthy(t.context.client.request.post.calledWith(`${trackRoot}/segments/1/add_customers`, { ids }));
});

test('#removeFromSegment works', (t) => {
  let ids = ['1', '2', '3'];

  sinon.stub(t.context.client.request, 'post');
  t.context.client.removeFromSegment(1, ids);

  t.truthy(t.context.client.request.post.calledWith(`${trackRoot}/segments/1/remove_customers`, { ids }));
});
