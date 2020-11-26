const Request = require('./request');
const { apiRoot } = require('./common');

module.exports = class CioAPIClient {
  constructor(appkey, defaults) {
    this.appkey = appkey;
    this.defaults = defaults;
    this.request = new Request(this.appkey, this.defaults);

    this._apiRoot = defaults && defaults.appApiUrl ? defaults.appApiUrl : apiRoot;
  }

  sendEmail(data) {
    return this.request.post(`${this._apiRoot}/send/email`, data);
  }
};
