const { APIClient, RegionUS, RegionEU } = require('../dist/index');
// In actual use require the node module:
// const { TrackClient, RegionUS, RegionEU } = require('customerio-node');
const appKey = require('./config').appKey;
const campaignId = require('./config').campaignId;
const segmentId = require('./config').segmentId;
const cio = new APIClient(appKey, { region: RegionUS });

const data = {
  headline: 'Roadrunner spotted in Albuquerque!',
  date: 1511315635,
  text: "We've received reports of a roadrunner in your immediate area! Head to your dashboard to view more information!",
};

cio.triggerBroadcast(campaignId, data, { segment: { id: segmentId } });
