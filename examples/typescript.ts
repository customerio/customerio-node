import { TrackClient, RegionUS, RegionEU } from '../index';
// In actual use import the node module:
// import { TrackClient, RegionUS, RegionEU } from 'customerio-node';
import { siteId, apiKey, customerId } from './config';
const cio = new TrackClient(siteId, apiKey, { region: RegionUS });

cio.identify(customerId, {
  email: 'customer@example.com',
  created_at: 1361205308,
  first_name: 'Bob-node-example',
  plan: 'basic',
});
