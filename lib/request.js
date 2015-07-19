let RSVP = require('rsvp');
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

  getError(e, body) {
    let message = `Unable to parse JSON.  Error: ${e} \nBody:\n ${body}`;
    let error = new Error(message);

    return error;
  }

  handler(error, response, body) {
    let promise = new RSVP.Promise((resolve, reject) => {
      if (error) {
        return reject(error);
      }

      let code = response.statusCode;

      if (code == 200 || code == 201) {
          if (body) {
              try {
                  resolve(JSON.parse(body));
              } catch (e) {
                  reject(this.getError(e, body));
              }
          } else {
              reject(null);
          }
      } else {
          try {
              resolve(JSON.parse(body));
          } catch (e) {
              reject(this.getError(e, body));
          }
      }
    });

    return promise;
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
