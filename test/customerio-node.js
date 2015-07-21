var assert = require('chai').assert;
var should = require('chai').should();
var sinon = require('sinon');
var CIO = require('../lib/customerio-node');

describe('#constructor', function() {
  it('sets siteid and apikey', function() {
    var cio = new CIO(123, 'abc');

    cio.siteid.should.equal(123);
    cio.apikey.should.equal('abc');
  });

  it('creates a request object that stores the siteid and apikey', function() {
    var cio = new CIO(123, 'abc');

    assert.ok(cio.request);
    cio.request.siteid.should.equal(123);
    cio.request.apikey.should.equal('abc');
  });
});

describe('#identify', function() {
  it('makes a PUT request', function() {
    var cio = new CIO(123, 'abc');
    var uri = cio.uri(1);

    sinon.stub(cio.request, 'put');

    cio.identify(1);

    assert.ok(cio.request.put.calledWith(uri, {}));
  });
});

describe('#destroy', function() {
  it('makes a DEvarE request', function() {
    var cio = new CIO(123, 'abc');
    var uri = cio.uri(1);

    sinon.stub(cio.request, 'destroy');

    cio.destroy(1);

    assert.ok(cio.request.destroy.calledWith(uri));
  });
});

describe('#track', function() {
  it('makes a POST request', function() {
    var cio = new CIO(123, 'abc');
    var uri = cio.uri(1) + '/' + events;

    sinon.stub(cio.request, 'post');

    cio.track(1);

    assert.ok(cio.request.post.calledWith(uri, {}));
  });
});

describe('#trackPageView', function() {
  it('makes a POST request', function() {
    var cio = new CIO(123, 'abc');
    var uri = cio.uri(1);

    sinon.stub(cio.request, 'post');

    cio.trackPageView(1, '#home');

    assert.ok(cio.request.post.calledWith(uri, { type: 'page', name: '#home'}));
  });
});
