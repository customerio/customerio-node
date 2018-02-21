const test = require('ava')
const sinon = require('sinon')
const CIO = require('../lib')

const base = 'https://track.customer.io/api/v1'

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

test('#identify works', t => {
  sinon.stub(t.context.client.request, 'put')
  t.context.client.identify(1)
  t.truthy(t.context.client.request.put.calledWith(`${base}/customers/1`, {}))
})

test('#destroy works', t => {
  sinon.stub(t.context.client.request, 'destroy')
  t.context.client.destroy(1)
  t.truthy(t.context.client.request.destroy.calledWith(`${base}/customers/1`))
})

test('#track with customer id works', t => {
  sinon.stub(t.context.client.request, 'post')
  t.context.client.track(1, { data: 'yep' })
  t.truthy(
    t.context.client.request.post.calledWith(`${base}/customers/1/events`, {
      data: 'yep'
    })
  )
})

test('#track without customer id works', t => {
  sinon.stub(t.context.client.request, 'post')
  t.context.client.track({ data: 'yep' })
  t.truthy(
    t.context.client.request.post.calledWith(`${base}/events`, { data: 'yep' })
  )
})

test('#trackPageView works', t => {
  sinon.stub(t.context.client.request, 'post')
  t.context.client.trackPageView(1, '#home')
  t.truthy(
    t.context.client.request.post.calledWith(`${base}/customers/1/events`, {
      type: 'page',
      name: '#home'
    })
  )
})

test('#triggerBroadcast works', t => {
  sinon.stub(t.context.client.request, 'post')
  t.context.client.triggerBroadcast(1, { type: 'data' }, { type: 'recipients' })
  t.truthy(
    t.context.client.request.post.calledWith(`${base}/campaigns/1/triggers`, {
      data: { type: 'data' },
      recipients: { type: 'recipients' }
    })
  )
})
