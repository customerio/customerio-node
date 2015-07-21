var assert = require('chai').assert;
var should = require('chai').should();
var Request = require('../lib/request');

describe('#constructor', function() {
  it('sets siteid and apikey', function() {
    var request = new Request(123, 'abc');

    request.siteid.should.equal(123);
    request.apikey.should.equal('abc');
  });

  it('sets the auth property to a Basic Authorization type', function() {
    var request = new Request(123, 'abc');
    var auth = 'Basic ' + new Buffer(request.siteid + ':' + request.apikey).toString('base64');

    request.auth.should.equal(auth);
  });
});

describe('#options', function() {
  it('returns an Object of options to be passed to the request', function() {
    var request = new Request(123, 'abc');

    var uri = 'https://track.customer.io/api/v1/customers/1';
    var auth = 'Basic ' + new Buffer(request.siteid + ':' + request.apikey).toString('base64');

    var expectedOptions = {
      headers: { Authorization: auth },
      uri: uri,
      timeout: 10000,
      method: 'POST'
    }

    var resultOptions = request.options(uri, 'POST');

    assert.deepEqual(resultOptions, expectedOptions);
  });
});

describe('#identify', function() {

});

describe('#track', function() {

});

describe('#page', function() {

});
