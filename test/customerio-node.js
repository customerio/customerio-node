let assert = require('chai').assert;
let should = require('chai').should();
let sinon = require('sinon');
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
  it('makes a PUT request', function() {
    let cio = new CIO(123, 'abc');

    sinon.stub(cio.request, 'put');

    cio.identify(1);

    assert.ok(cio.request.put.calledWith(1, {}));
  });
});

describe('#destroy', function() {
  it('makes a DELETE request', function() {
    let cio = new CIO(123, 'abc');

    sinon.stub(cio.request, 'destroy');

    cio.destroy(1);

    assert.ok(cio.request.destroy.calledWith(1));
  });
});

describe('#track', function() {
  it('makes a POST request', function() {
    let cio = new CIO(123, 'abc');

    sinon.stub(cio.request, 'post');

    cio.track(1);

    assert.ok(cio.request.post.calledWith(1, {}));
  });
});

describe('#trackPageView', function() {
  it('makes a POST request', function() {
    let cio = new CIO(123, 'abc');

    sinon.stub(cio.request, 'post');

    cio.trackPageView(1, '#home');

    assert.ok(cio.request.post.calledWith(1, { type: 'page', name: '#home'}));
  });
});
