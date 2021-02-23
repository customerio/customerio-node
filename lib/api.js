const Request = require('./request');
const { apiRoot, Regions } = require('./common');
const { SendEmailRequest } = require('../lib/api/requests');

class APIClient {
  constructor(appKey, defaults = {}) {
    this.appKey = appKey;
    this.defaults = defaults;
    this.defaults = { region: Regions.us, ...defaults };
    this.request = new Request(this.appKey, this.defaults);

    if (!Object.values(Regions).includes(this.defaults.region)) {
      throw new Error('region must be one of "eu" or "us"');
    }

    this.apiRoot = this.defaults.url ? this.defaults.url : apiRoot[this.defaults.region];
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
