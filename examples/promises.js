const { TrackClient, RegionUS, RegionEU } = require('../dist/index');
// In actual use require the node module:
// const { TrackClient, RegionUS, RegionEU } = require('customerio-node');
const siteId = require('./config').siteId;
const apiKey = require('./config').apiKey;
const customerId = require('./config').customerId;
const cio = new TrackClient(siteId, apiKey, { region: RegionUS });

cio
  .identify(customerId, {
    email: 'customer@example.com',
    created_at: 1361205308,
    first_name: 'Bob',
    plan: 'basic',
  })
  .then(() => {
    return cio.track(customerId, {
      name: 'purchase',
      data: {
        price: '23.45',
        product: 'socks',
      },
    });
  });
