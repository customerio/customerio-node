const Request = require('./request');
const { Region, RegionUS } = require('./regions');
const { isEmpty } = require('./utils');

class MissingParamError extends Error {
  constructor(param) {
    super(param);
    this.message = `${param} is required`;
  }
}

module.exports = class TrackClient {
  constructor(siteid, apikey, defaults = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.siteid = siteid;
    this.apikey = apikey;
    this.defaults = { ...defaults, region: defaults.region || RegionUS };
    this.request = new Request({ siteid: this.siteid, apikey: this.apikey }, this.defaults);

    this.trackRoot = this.defaults.url ? this.defaults.url : this.defaults.region.trackUrl;
    this.apiRoot = this.defaults.apiUrl ? this.defaults.apiUrl : this.defaults.region.apiUrl;
  }

  identify(customerId, data = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.put(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}`, data);
  }

  destroy(customerId) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.destroy(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}`);
  }

  suppress(customerId) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/suppress`);
  }

  track(customerId, data = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/events`, data);
  }

  trackAnonymous(data = {}) {
    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    return this.request.post(`${this.trackRoot}/events`, data);
  }

  trackPageView(customerId, path) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(path)) {
      throw new MissingParamError('path');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/events`, {
      type: 'page',
      name: path,
    });
  }

  addDevice(customerId, device_id, platform, data = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(device_id)) {
      throw new MissingParamError('device_id');
    }

    if (isEmpty(platform)) {
      throw new MissingParamError('platform');
    }

    return this.request.put(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/devices`, {
      device: { id: device_id, platform, ...data },
    });
  }

  deleteDevice(customerId, deviceToken) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(deviceToken)) {
      throw new MissingParamError('deviceToken');
    }

    return this.request.destroy(
      `${this.trackRoot}/customers/${encodeURIComponent(customerId)}/devices/${encodeURIComponent(deviceToken)}`,
    );
  }
};
