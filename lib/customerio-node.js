require('babel/register');

let Request = require('./request');

module.exports = class CustomerIO {
  constructor(siteid, apikey) {
    this.siteid = siteid;
    this.apikey = apikey;
    this.request = new Request(this.siteid, this.apikey);
  }

  identify(id, data = {}) {
    return request.put(id, data);
  }

  destroy(id) {
    return request.destroy(id);
  }

  track(id, data = {}) {
    return request.post(id, data);
  }

  trackPageView(id, page, data = {}) {
    data.type = 'page';
    data.name = page;

    return request.post(id, data);
  }
};
