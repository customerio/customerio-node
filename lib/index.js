const Request = require('./request')
const BASE_URL = 'https://track.customer.io/api/v1/customers/'

module.exports = class CustomerIO {
  constructor(siteid, apikey) {
    this.siteid = siteid
    this.apikey = apikey
    this.request = new Request(this.siteid, this.apikey)
  }

  uri(id) {
    return `${BASE_URL}${id.toString()}`
  }

  identify(id, data = {}) {
    return this.request.put(this.uri(id), data)
  }

  destroy(id) {
    return this.request.destroy(this.uri(id))
  }

  track(id, data = {}) {
    return this.request.post(`${this.uri(id)}/events`, data)
  }

  trackPageView(id, path) {
    return this.request.post(`${this.uri(id)}/events`, {
      type: 'page',
      name: path
    })
  }
}
