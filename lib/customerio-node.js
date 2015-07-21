require('babel/register');

let Request = require('./request');
let url = require('url');

const BASE_URL = 'https://track.customer.io/api/v1/customers';

module.exports = class CustomerIO {
  constructor(siteid, apikey) {
    this.siteid = siteid;
    this.apikey = apikey;
    this.request = new Request(this.siteid, this.apikey);
  }

  uri(id) {
    // NOTE: id must be of type string in order for
    // url.resolve to work correctly.
    return url.resolve(BASE_URL, id.toString());
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
