const Request = require('./request')
const trackRoot = 'https://track.customer.io/api/v1'
const apiRoot = 'https://api.customer.io/v1/api'
const betaApiRoot = 'https://beta-api.customer.io/v1/api'

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

  addDevice(id, device_id, platform, data = {}) {
    return this.request.put(`${trackRoot}/customers/${id}/devices`, {
      device: Object.assign({ id: device_id, platform }, data)
    })
  }

  deleteDevice(id, token) {
    return this.request.destroy(`${trackRoot}/customers/${id}/devices/${token}`)
  }

  triggerBroadcast(id, data, recipients) {
    return this.request.post(`${apiRoot}/campaigns/${id}/triggers`, {
      data,
      recipients
    })
  }

  addToSegment(segmentId, customerIds = []) {
    return this.request.post(
      `${trackRoot}/segments/${segmentId}/add_customers`,
      {
        ids: customerIds
      }
    )
  }

  removeFromSegment(segmentId, customerIds = []) {
    return this.request.post(
      `${trackRoot}/segments/${segmentId}/remove_customers`,
      {
        ids: customerIds
      }
    )
  }

  // beta methods
  getSegments() {
    // List segments
    return this.request.get(`${betaApiRoot}/segments/`)
  }

  getSegmentMembership(segmentId, start = null, limit = 100) {
    // Get the membership of a segment
    // start: The contination token to retrieve the next set of ids
    // limit: The maximum number of ids to retrieve
    let options = {}
    if (limit) options.limit = limit
    if (start) options.start = start
    return this.request.get(
      `${betaApiRoot}/segments/${segmentId}/membership/`,
      options
    )
  }
}
