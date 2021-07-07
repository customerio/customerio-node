const { TrackClient, RegionUS, RegionEU } = require('../index');
// In actual use require the node module:
// const { TrackClient, RegionUS, RegionEU } = require('customerio-node');
const siteId = require('./config').siteId;
const apiKey = require('./config').apiKey;
const campaignId = require('./config').campaignId;
const cio = new TrackClient(siteId, apiKey, { region: RegionUS });

const data = {
  headline: 'Roadrunner spotted in Albuquerque!',
  date: 1511315635,
  text:
    "We've received reports of a roadrunner in your immediate area! Head to your dashboard to view more information!",
};

cio.triggerBroadcast(campaignId, data, { segment: { id: 7 } });
