import avaTest, { TestInterface } from 'ava';
import sinon, { SinonStub } from 'sinon';
import { TrackClient } from '../lib/track';
import { RegionUS, RegionEU } from '../lib/regions';
import { IdentifierType } from '../lib/types';

type TestContext = { client: TrackClient };

const test = avaTest as TestInterface<TestContext>;

test.beforeEach((t) => {
  t.context.client = new TrackClient('123', 'abc');
});

const ID_INPUTS = Object.freeze([
  [1, '1'],
  ['2 ', encodeURIComponent('2 ')],
  ['3/', encodeURIComponent('3/')],
  ['%&*/test.#@!~', encodeURIComponent('%&*/test.#@!~')],
]);

test('constructor sets necessary variables', (t) => {
  t.is(t.context.client.siteid, '123');
  t.is(t.context.client.apikey, 'abc');
  t.is(t.context.client.trackRoot, RegionUS.trackUrl);

  t.truthy(t.context.client.request);
  t.is(t.context.client.request.siteid, '123');
  t.is(t.context.client.request.apikey, 'abc');
});

test('constructor sets correct URL for different regions', (t) => {
  [RegionUS, RegionEU].forEach((region) => {
    let client = new TrackClient('123', 'abc', { region });

    t.is(client.siteid, '123');
    t.is(client.apikey, 'abc');
    t.is(client.trackRoot, region.trackUrl);

    t.truthy(client.request);
    t.is(client.request.siteid, '123');
    t.is(client.request.apikey, 'abc');
  });
});

test('constructor sets correct URL for custom URL', (t) => {
  let client = new TrackClient('123', 'abc', { url: 'https://example.com/url' });

  t.is(client.siteid, '123');
  t.is(client.apikey, 'abc');
  t.is(client.trackRoot, 'https://example.com/url');

  t.truthy(client.request);
  t.is(client.request.siteid, '123');
  t.is(client.request.apikey, 'abc');
});

test('passing in an invalid region throws an error', (t) => {
  t.throws(
    () => {
      new TrackClient('123', 'abc', { region: 'au' } as any);
    },
    {
      message: 'region must be one of Regions.US or Regions.EU',
    },
  );
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#identify works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'put');
    t.throws(() => t.context.client.identify(''), { message: 'customerId is required' });

    t.context.client.identify(input);
    t.truthy((t.context.client.request.put as SinonStub).calledWith(`${RegionUS.trackUrl}/customers/${expected}`, {}));
  });
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#destroy works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'destroy');
    t.throws(() => t.context.client.destroy(''), { message: 'customerId is required' });

    t.context.client.destroy(input);
    t.truthy((t.context.client.request.destroy as SinonStub).calledWith(`${RegionUS.trackUrl}/customers/${expected}`));
  });
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#suppress works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'post');
    t.throws(() => t.context.client.suppress(''), { message: 'customerId is required' });

    t.context.client.suppress(input);
    t.truthy(
      (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.trackUrl}/customers/${expected}/suppress`),
    );
  });
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#track with customer id works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'post');
    t.throws(() => t.context.client.track(''), { message: 'customerId is required' });

    t.throws(() => t.context.client.track(input, { data: {} }), { message: 'data.name is required' });
    t.context.client.track(input, { name: 'purchase', data: 'yep' });
    t.truthy(
      (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.trackUrl}/customers/${expected}/events`, {
        name: 'purchase',
        data: 'yep',
      }),
    );
  });
});

test('#trackAnonymous works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.throws(() => t.context.client.trackAnonymous(''), { message: 'data.name is required' });
  t.throws(() => t.context.client.trackAnonymous('123'), { message: 'data.name is required' });
  t.throws(() => t.context.client.trackAnonymous('123', { data: {} }), { message: 'data.name is required' });
  t.context.client.trackAnonymous('123', { name: 'purchase', data: 'yep' });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.trackUrl}/events`, {
      anonymous_id: '123',
      name: 'purchase',
      data: 'yep',
    }),
  );
});

test('#trackAnonymous ignores blank anonymousId', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.trackAnonymous('', { name: 'purchase', data: 'yep' });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.trackUrl}/events`, {
      name: 'purchase',
      data: 'yep',
    }),
  );
});

test('#trackPush works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  t.context.client.trackPush();
  t.truthy((t.context.client.request.post as SinonStub).calledWith(`${RegionUS.trackUrl}/push/events`, {}));

  t.context.client.trackPush({
    delivery_id: 'RPILAgUBcRhIBqSfeiIwdIYJKxTY',
    event: 'opened',
    device_id: 'CIO-Delivery-Token from the notification',
    timestamp: 1613063089,
  });
  t.truthy(
    (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.trackUrl}/push/events`, {
      delivery_id: 'RPILAgUBcRhIBqSfeiIwdIYJKxTY',
      event: 'opened',
      device_id: 'CIO-Delivery-Token from the notification',
      timestamp: 1613063089,
    }),
  );
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#trackPageView works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'post');
    t.throws(() => (t.context.client.trackPageView as any)(''), { message: 'customerId is required' });

    t.throws(() => t.context.client.trackPageView(input, ''), { message: 'path is required' });
    t.context.client.trackPageView(input, '#home');
    t.truthy(
      (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.trackUrl}/customers/${expected}/events`, {
        type: 'page',
        name: '#home',
      }),
    );
  });
});

ID_INPUTS.forEach(([input, expected]) => {
  test(`#addDevice works for ${input}`, (t) => {
    sinon.stub(t.context.client.request, 'put');

    t.throws(() => t.context.client.addDevice(null as any, '', 'ios', { primary: true }), {
      message: 'customerId is required',
    });
    t.throws(() => t.context.client.addDevice(input, '', 'ios', { primary: true }), {
      message: 'device_id is required',
    });
    t.throws(() => t.context.client.addDevice(input, '123', '', { primary: true }), {
      message: 'platform is required',
    });

    t.context.client.addDevice(input, '123', 'ios', { primary: true, last_used: 1613063089 });
    t.truthy(
      (t.context.client.request.put as SinonStub).calledWith(`${RegionUS.trackUrl}/customers/${expected}/devices`, {
        device: {
          id: '123',
          platform: 'ios',
          last_used: 1613063089,
          attributes: {
            primary: true,
          },
        },
      }),
    );
  });
});

test('#addDevice works with an empty data parameter', (t) => {
  sinon.stub(t.context.client.request, 'put');
  t.context.client.addDevice(1, '123', 'ios');
  t.truthy(
    (t.context.client.request.put as SinonStub).calledWith(`${RegionUS.trackUrl}/customers/1/devices`, {
      device: {
        id: '123',
        platform: 'ios',
      },
    }),
  );
});

test('#deleteDevice works', (t) => {
  sinon.stub(t.context.client.request, 'destroy');
  t.throws(() => (t.context.client.deleteDevice as any)(''), { message: 'customerId is required' });
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
      (t.context.client.request.destroy as SinonStub).calledWith(
        `${RegionUS.trackUrl}/customers/${encodedCustomerId}/devices/${encodedToken}`,
      ),
    );
  });
});

test('#mergeCustomers validations work', (t) => {
  t.throws(() => t.context.client.mergeCustomers(IdentifierType.Id, '', IdentifierType.Id, 'id2'), {
    message: 'primaryId is required',
  });
  t.throws(() => t.context.client.mergeCustomers(IdentifierType.Email, 'id1', IdentifierType.CioId, ''), {
    message: 'secondaryId is required',
  });
});

test('#mergeCustomers works', (t) => {
  sinon.stub(t.context.client.request, 'post');
  [
    ['email', 'cool.person@company.com', 'email', 'cperson@gmail.com'],
    ['id', 'cool.person@company.com', 'cio_id', 'person2'],
    ['cio_id', 'CIO123', 'id', 'person1'],
  ].forEach(([pTypeString, pId, sTypeString, sId]) => {
    t.context.client.mergeCustomers(pTypeString as IdentifierType, pId, sTypeString as IdentifierType, sId);
    t.truthy(
      (t.context.client.request.post as SinonStub).calledWith(`${RegionUS.trackUrl}/merge_customers`, {
        primary: {
          [pTypeString]: pId,
        },
        secondary: {
          [sTypeString]: sId,
        },
      }),
    );
  });
});
