let request = require('request');

const BASE_URL = 'https://track.customer.io/api/v1/customers';
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

  put(id, data = {}) {
    let options = this.options(`${BASE_URL}/${id}`, 'PUT', data);

    return request(options, this.handler);
  }

  destroy(id) {
    let options = this.options(`${BASE_URL}/${id}`, 'DELETE');

    return request(options, this.handler);
  }

  post(id, data={}) {
    let options = this.options(`${BASE_URL}/${id}`, 'POST', data);

    return request(options, this.handler);
  }
};
