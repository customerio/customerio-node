require('babel/register');

let Request = require('./request');

const BASE_URL = 'https://track.customer.io/api/v1/customers';

module.exports = class CustomerIO {
  constructor(siteid, apikey) {
    this.siteid = siteid;
    this.apikey = apikey;
    this.request = new Request(this.siteid, this.apikey);
  }

  uri(id) {
    return `${BASE_URL}/${id}`;
  }

  identify(id, data = {}) {
    let uri = this.uri(id);

    return this.request.put(uri, data);
  }

  destroy(id) {
    let uri = this.uri(id);

    return this.request.destroy(uri);
  }

  track(id, data = {}) {
    let uri = `${this.uri(id)}/events`;

    return this.request.post(uri, data);
  }

  trackPageView(id, page, data = {}) {
    let uri = this.uri(id);

    data.type = 'page';
    data.name = page;

    return this.request.post(uri, data);
  }
};
