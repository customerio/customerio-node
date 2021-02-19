const Request = require('./request');
const { apiRoot } = require('./common');
const { SendEmailRequest } = require('../lib/api/requests');

class APIClient {
  constructor(appKey, defaults = { region: 'us' }) {
    this.appKey = appKey;
    this.defaults = defaults;
    this.request = new Request(this.appKey, this.defaults);

    if (!['us', 'eu'].includes(defaults.region)) {
      throw new Error('region must be one of "eu" or "us"');
    }

    this.apiRoot = defaults && defaults.url ? defaults.url : apiRoot[defaults.region];
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
