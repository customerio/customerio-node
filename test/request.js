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

describe('#identify', function() {

});

describe('#track', function() {

});

describe('#page', function() {

});
