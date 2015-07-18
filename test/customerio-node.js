let assert = require('chai').assert;
let should = require('chai').should();
let CIO = require('../lib/customerio-node');

describe('#constructor', function() {
  it('sets siteid and apikey', function() {
    let cio = new CIO(123, 'abc');

    cio.siteid.should.equal(123);
    cio.apikey.should.equal('abc');
  });

  it('creates a request object that stores the siteid and apikey', function() {
    let cio = new CIO(123, 'abc');

    assert.ok(cio.request);
    cio.request.siteid.should.equal(123);
    cio.request.apikey.should.equal('abc');
  });
});

describe('#identify', function() {

});

describe('#track', function() {

});

describe('#page', function() {

});
