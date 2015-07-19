let request = require('request');

const TIMEOUT = 10000;

module.exports = class Request {
  constructor(siteid, apikey) {
    this.siteid = siteid;
    this.apikey = apikey;
    this.auth = 'Basic ' + new Buffer(`${this.siteid}:${this.apikey}`).toString('base64');
  }

  options(uri, method, data) {
    let headers = { 'Authorization': this.auth };
    let body = data ? JSON.stringify(data) : null;
    let timeout = TIMEOUT;
    let options = {
      method, uri, headers, body, timeout
    };

    if (!body) {
      delete options.body;
    }

    return options;
  }

  handler() {
  }

  put(uri, data = {}) {
    let options = this.options(uri, 'PUT', data);

    return request(options, this.handler);
  }

  destroy(uri) {
    let options = this.options(uri, 'DELETE');

    return request(options, this.handler);
  }

  post(uri, data={}) {
    let options = this.options(uri, 'POST', data);

    return request(options, this.handler);
  }
};
