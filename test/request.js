let assert = require('chai').assert;
let should = require('chai').should();
let Request = require('../lib/request');

describe('#constructor', function() {
  it('sets siteid and apikey', function() {
    let request = new Request(123, 'abc');

    request.siteid.should.equal(123);
    request.apikey.should.equal('abc');
  });

  it('sets the auth property to a Basic Authorization type', function() {
    let request = new Request(123, 'abc');
    let auth = 'Basic ' + new Buffer(`${request.siteid}:${request.apikey}`).toString('base64');

    request.auth.should.equal(auth);
  });
});

describe('#options', function() {
  it('returns an Object of options to be passed to the request', function() {
    let request = new Request(123, 'abc');

    let uri = 'https://track.customer.io/api/v1/customers/1';
    let auth = 'Basic ' + new Buffer(`${request.siteid}:${request.apikey}`).toString('base64');

    let expectedOptions = {
      headers: { Authorization: auth },
      uri,
      timeout: 10000,
      method: 'POST'
    }

    let resultOptions = request.options(uri, 'POST');

    assert.deepEqual(resultOptions, expectedOptions);
  });
});

describe('#identify', function() {

});

describe('#track', function() {

});

describe('#page', function() {

});
