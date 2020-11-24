const Request = require("./request");
const { apiRoot } = require("./common");

module.exports = class CioAPIClient {
  constructor(appkey, defaults) {
    this.appkey = appkey;
    this.defaults = defaults;
    this.request = new Request(this.appkey, this.defaults);
  }

  sendEmail(data) {
    return this.request.post(`${apiRoot}/send/email`, data);
  }
};
