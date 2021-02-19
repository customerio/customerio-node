const Regions = {
  us: 'us',
  eu: 'eu',
};

module.exports = {
  Regions,
  trackRoot: {
    [Regions.us]: 'https://track.customer.io/api/v1',
    [Regions.eu]: 'https://track-eu.customer.io/api/v1',
  },
  apiRoot: {
    [Regions.us]: 'https://api.customer.io/v1',
    [Regions.eu]: 'https://api-eu.customer.io/v1',
  },
};
