const Request = require('./request');
const Regions = require('./regions');
const { SendEmailRequest } = require('./api/requests');

class APIClient {
  constructor(appKey, defaults = {}) {
    if (defaults.region && !Object.keys(Regions).includes(defaults.region)) {
      throw new Error('region must be one of "us" or "eu"');
    }

    this.appKey = appKey;
    this.defaults = defaults;
    this.defaults = { ...defaults, region: Regions[defaults.region || 'us'] };
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
