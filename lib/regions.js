class Region {
  constructor(trackUrl, apiUrl) {
    this.trackUrl = trackUrl;
    this.apiUrl = apiUrl;
  }
}

module.exports = {
  Region,
  RegionUS: new Region('https://track.customer.io/api/v1', 'https://api.customer.io/v1'),
  RegionEU: new Region('https://track-eu.customer.io/api/v1', 'https://api-eu.customer.io/v1'),
};
