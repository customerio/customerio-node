const { PipelinesClient, RegionUS } = require('../dist/index');
// In actual use require the node module:
// const { PipelinesClient, RegionUS } = require('customerio-node');
const writeKey = require('./config').pipelinesWriteKey;
const customerId = require('./config').customerId;

const cio = new PipelinesClient(writeKey, { region: RegionUS });

// identify a person
cio.identify({
  userId: customerId,
  traits: {
    email: 'customer@example.com',
    plan: 'pro',
  },
});

// record an event
cio.track({
  userId: customerId,
  event: 'Order Completed',
  properties: {
    price: 23.45,
    product: 'socks',
  },
});

// page view from a server-rendered request
cio.page({
  userId: customerId,
  name: 'Pricing',
  properties: { path: '/pricing' },
});

// associate the person with an object/group
cio.group({
  userId: customerId,
  groupId: 'acme-co',
  traits: { plan: 'enterprise' },
});

// merge an anonymous identity into a known person
cio.alias({
  userId: customerId,
  previousId: 'anon-abc-123',
});

// batch multiple events in one HTTP request
cio.batch([
  { type: 'identify', userId: customerId, traits: { plan: 'pro' } },
  { type: 'track', userId: customerId, event: 'Subscribed', properties: { plan: 'pro' } },
]);
