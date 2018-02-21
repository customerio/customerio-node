const test = require('ava')
const sinon = require('sinon')
const CIO = require('../lib/customerio-node')

test.beforeEach(t => {
  t.context.client = new CIO(123, 'abc')
})

test('constructor sets necessary variables', t => {
  t.is(t.context.client.siteid, 123)
  t.is(t.context.client.apikey, 'abc')
  t.truthy(t.context.client.request)
  t.is(t.context.client.request.siteid, 123)
  t.is(t.context.client.request.apikey, 'abc')
})

test('#identify makes a PUT request', t => {
  const uri = t.context.client.uri(1)
  sinon.stub(t.context.client.request, 'put')
  t.context.client.identify(1)
  t.truthy(t.context.client.request.put.calledWith(uri, {}))
})

test('#destroy makes a DELETE request', t => {
  const uri = t.context.client.uri(1)
  sinon.stub(t.context.client.request, 'destroy')
  t.context.client.destroy(1)
  t.truthy(t.context.client.request.destroy.calledWith(uri))
})

test('#track makes a POST request', t => {
  const uri = t.context.client.uri(1) + '/events'
  sinon.stub(t.context.client.request, 'post')
  t.context.client.track(1)
  t.truthy(t.context.client.request.post.calledWith(uri, {}))
})

test('#trackPageView makes a POST request', t => {
  const uri = t.context.client.uri(1) + '/events'
  sinon.stub(t.context.client.request, 'post')
  t.context.client.trackPageView(1, '#home')
  t.truthy(
    t.context.client.request.post.calledWith(uri, {
      type: 'page',
      name: '#home'
    })
  )
})
