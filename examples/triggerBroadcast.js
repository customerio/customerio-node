let CIO = require('../lib/track');
// In actual use require the node module: let CIO = require('customerio-node');
const siteId = require('./config').siteId;
const apiKey = require('./config').apiKey;
const campaignId = require('./config').campaignId;
// In actual use, specify your specific region and require node module: const { RegionUS, RegionEU } = require('customerio-node/regions')
const { RegionUS, RegionEU } = require('../lib/regions');
const cio = new CIO(siteId, apiKey, { region: RegionUS });

const data = {
  headline: 'Roadrunner spotted in Albuquerque!',
  date: 1511315635,
  text:
    "We've received reports of a roadrunner in your immediate area! Head to your dashboard to view more information!",
};

cio.triggerBroadcast(campaignId, data, { segment: { id: 7 } });
