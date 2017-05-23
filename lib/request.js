var RSVP = require('rsvp');
var request = require('request');

var TIMEOUT = 10000;

function Request(siteid, apikey) {
  this.siteid = siteid;
  this.apikey = apikey;
  this.auth = 'Basic ' + new Buffer(this.siteid + ':' + this.apikey, 'utf8').toString('base64');
  this._request = request;

  this.options = function(uri, method, data) {
    var headers = {
      'Authorization': this.auth,
      'Content-Type': 'application/json'
    };
    var body = data ? JSON.stringify(data) : null;
    var timeout = TIMEOUT;
    var options = {
      method: method,
      uri: uri,
      headers: headers,
      body: body,
      timeout: timeout
    };

    if (!body) {
      delete options.body;
    }

    return options;
  };

  this.handler = function(options) {
    var _this = this;

    return new RSVP.Promise(function(resolve, reject) {
      _this._request(options, function(error, response, body) {
        if (error) {
          return reject(error);
        }

        var json = null;
        try {
          if (body) {
            json = JSON.parse(body);
          }
        } catch (e) {
          var message = 'Unable to parse JSON.  Error: ' + e + ' \nBody:\n ' + body;
          var error = new Error(message);

          reject(error);
          return;
        }

        var code = response.statusCode;
        if (code == 200 || code == 201) {
          resolve(json);
        } else {
          var error = { message: (json.meta && json.meta.error) || 'Unknown error', statusCode: response.statusCode, response: response, body: body }
          reject(error);
        }
      });
    });
  };

  this.put = function(uri, data) {
    var options = this.options(uri, 'PUT', data);

    if (!data) {
      data = {};
    }

    return this.handler(options);
  };

  this.destroy = function(uri) {
    var options = this.options(uri, 'DELETE');

    return this.handler(options);
  };

  this.post = function(uri, data) {
    var options = this.options(uri, 'POST', data);

    if (!data) {
      data = {};
    }

    return this.handler(options);
  };
}

module.exports = Request;
