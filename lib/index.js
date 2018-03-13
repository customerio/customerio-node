const Request = require('./request')
const trackRoot = 'https://track.customer.io/api/v1'
const apiRoot = 'https://api.customer.io/v1/api'

module.exports = class CustomerIO {
  constructor(siteid, apikey) {
    this.siteid = siteid
    this.apikey = apikey
    this.request = new Request(this.siteid, this.apikey)
  }

  identify(id, data = {}) {
    return this.request.put(`${trackRoot}/customers/${id}`, data)
  }

  destroy(id) {
    return this.request.destroy(`${trackRoot}/customers/${id}`)
  }

  track(id, data = {}) {
    return this.request.post(`${trackRoot}/customers/${id}/events`, data)
  }

  trackAnonymous(data = {}) {
    return this.request.post(`${trackRoot}/events`, data)
  }

  trackPageView(id, path) {
    return this.request.post(`${trackRoot}/customers/${id}/events`, {
      type: 'page',
      name: path
    })
  }

  triggerBroadcast(id, data, recipients) {
    return this.request.post(`${apiRoot}/campaigns/${id}/triggers`, {
      data,
      recipients
    })
  }
}
