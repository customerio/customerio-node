import CIO from '../track';
// In actual use import the node module: import CIO from 'customerio-node';
import { siteId, apiKey, customerId } from './config';
// In actual use, specify your specific region and import the node module: const { RegionUS, RegionEU } from 'customerio-node/regions)
import { RegionUS, RegionEU } from '../regions';
const cio = new CIO(siteId, apiKey, { region: RegionUS });

cio.identify(1005, {
  email: 'customer@example.com',
  created_at: 1361205308,
  first_name: 'Bob-node-example',
  plan: 'basic',
});
