const { APIClient, RegionUS, RegionEU } = require('../dist/index');
// In actual use require the node module:
// const { TrackClient, RegionUS, RegionEU } = require('customerio-node');
const appKey = require('./config').appKey;
const campaignId = require('./config').campaignId;
const segmentId = require('./config').segmentId;
const cio = new APIClient(appKey, { region: RegionUS });

const email = "hello@world.com"

cio.getCustomersByEmail(email);
