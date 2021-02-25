const Request = require('./request');
const { RegionUS, RegionEU } = require('./regions');
const { SendEmailRequest } = require('./api/requests');

class APIClient {
  constructor(appKey, defaults = {}) {
    this.appKey = appKey;
    this.defaults = defaults;
    this.defaults = { region: RegionUS, ...defaults };
    this.request = new Request(this.appKey, this.defaults);

    if (![RegionUS, RegionEU].includes(this.defaults.region)) {
      throw new Error('region must be one of RegionUS or RegionEU');
    }

    this.apiRoot = this.defaults.url ? this.defaults.url : this.defaults.region.apiUrl;
  }

  sendEmail(req) {
    if (!(req instanceof SendEmailRequest)) {
      throw new Error('"request" must be an instance of SendEmailRequest');
    }

    return this.request.post(`${this.apiRoot}/send/email`, req.message);
  }
}

module.exports = {
  APIClient,
  SendEmailRequest,
};
