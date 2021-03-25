const Request = require('./request');
const { Region, RegionUS } = require('./regions');
const { SendEmailRequest } = require('./api/requests');

class APIClient {
  constructor(appKey, defaults = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.appKey = appKey;
    this.defaults = { ...defaults, region: defaults.region || RegionUS };
    this.request = new Request(this.appKey, this.defaults);

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
