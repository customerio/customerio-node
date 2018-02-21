const Request = require('./request')
const root = 'https://track.customer.io/api/v1'

module.exports = class CustomerIO {
  constructor(siteid, apikey) {
    this.siteid = siteid
    this.apikey = apikey
    this.request = new Request(this.siteid, this.apikey)
  }

  identify(id, data = {}) {
    return this.request.put(`${root}/customers/${id}`, data)
  }

  destroy(id) {
    return this.request.destroy(`${root}/customers/${id}`)
  }

  track(id, data = {}) {
    return typeof id === 'object'
      ? this.request.post(`${root}/events`, id)
      : this.request.post(`${root}/customers/${id}/events`, data)
  }

  trackPageView(id, path) {
    return this.request.post(`${root}/customers/${id}/events`, {
      type: 'page',
      name: path
    })
  }

  triggerBroadcast(id, data, recipients) {
    return this.request.post(`${root}/campaigns/${id}/triggers`, {
      data,
      recipients
    })
  }
}
