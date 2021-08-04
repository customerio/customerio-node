const { TrackClient, RegionUS, RegionEU } = require('../dist/index');
// In actual use require the node module:
// const { TrackClient, RegionUS, RegionEU } = require('customerio-node');
const siteId = require('./config').siteId;
const apiKey = require('./config').apiKey;
const customerId = require('./config').customerId;
const cio = new TrackClient(siteId, apiKey, { region: RegionUS });

cio.destroy(customerId);
