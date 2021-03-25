let CIO = require('../lib/track');
// In actual use require the node module: let CIO = require('customerio-node');
const siteId = require('./config').siteId;
const apiKey = require('./config').apiKey;
const customerId = require('./config').customerId;
// In actual use, specify your specific region and require node module: const { RegionUS, RegionEU } = require('customerio-node/regions')
const { RegionUS, RegionEU } = require('../lib/regions');
const cio = new CIO(siteId, apiKey, { region: RegionUS });

cio.track(customerId, {
  name: 'purchase',
  data: {
    price: '23.45',
    product: 'socks',
  },
});

cio.trackAnonymous({
  name: 'purchase',
  data: {
    price: '23.45',
    product: 'socks',
  },
});
