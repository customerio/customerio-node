const Request = require('./request');
const { apiRoot } = require('./common');
const { SendEmailRequest } = require('../lib/api/requests');

module.exports = class APIClient {
  constructor(appKey, defaults) {
    this.appKey = appKey;
    this.defaults = defaults;
    this.request = new Request(this.appKey, this.defaults);

    this._apiRoot = defaults && defaults.url ? defaults.url : apiRoot;
  }

  sendEmail(message) {
    if (!(message instanceof SendEmailRequest)) {
      throw new Error('"message" must be an instance of SendEmailRequest');
    }

    return this.request.post(`${this._apiRoot}/send/email`, message.toObject());
  }
};
