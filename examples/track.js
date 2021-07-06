const { TrackClient, RegionUS, RegionEU } = require('../index');
// In actual use require the node module:
// const { TrackClient, RegionUS, RegionEU } = require('customerio-node');
const siteId = require('./config').siteId;
const apiKey = require('./config').apiKey;
const customerId = require('./config').customerId;
const anonymousId = require('./config').anonymousId;
const cio = new TrackClient(siteId, apiKey, { region: RegionUS });

cio.track(customerId, {
  name: 'purchase',
  data: {
    price: '23.45',
    product: 'socks',
  },
});

cio.trackAnonymous(anonymousId, {
  name: 'purchase',
  data: {
    price: '23.45',
    product: 'socks',
  },
});
