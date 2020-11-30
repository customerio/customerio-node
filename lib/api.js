const Request = require('./request');
const { apiRoot } = require('./common');
const TransactionalEmail = require('./transactional-email');

module.exports = class APIClient {
  constructor(appKey, defaults) {
    this.appKey = appKey;
    this.defaults = defaults;
    this.request = new Request(this.appKey, this.defaults);

    this._apiRoot = defaults && defaults.url ? defaults.url : apiRoot;
  }

  sendEmail(message) {
    if (!(message instanceof TransactionalEmail)) {
      throw new Error('"message" must be an instance of TransactionalEmail');
    }

    return this.request.post(`${this._apiRoot}/send/email`, message.toObject());
  }
};
