const Request = require('./request');
const { apiRoot } = require('./common');

module.exports = class APIClient {
  constructor(appKey, defaults) {
    this.appKey = appKey;
    this.defaults = defaults;
    this.request = new Request(this.appKey, this.defaults);

    this._apiRoot = defaults && defaults.url ? defaults.url : apiRoot;
  }

  sendEmail(data) {
    return this.request.post(`${this._apiRoot}/send/email`, data);
  }
};
