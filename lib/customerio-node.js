var Request = require('./request');

var BASE_URL = 'https://track.customer.io/api/v1/customers/';

function CustomerIO(siteid, apikey) {
  this.siteid = siteid;
  this.apikey = apikey;
  this.request = new Request(this.siteid, this.apikey);

  this.uri = function(id) {
    var uri = BASE_URL + id.toString();

    return uri;
  };

  this.identify = function(id, data) {
    var uri = this.uri(id);

    if (!data) {
      data = {};
    }

    return this.request.put(uri, data);
  };

  this.destroy = function(id) {
    var uri = this.uri(id);

    return this.request.destroy(uri);
  };

  this.track = function(id, data) {
    var uri = this.uri(id) + '/events';

    if (!data) {
      data = {};
    }

    return this.request.post(uri, data);
  };

  this.trackPageView = function(id, path) {
    var uri = this.uri(id) + '/events';
    var data = {
      type: 'page',
      name: path
    };

    return this.request.post(uri, data);
  };
}

module.exports = CustomerIO;
