import CIORequest from './request.js';
import { Region, RegionUS } from './regions.js';
import { isEmpty, isIdentifierType, MissingParamError } from './utils.js';

/** @typedef {import('./request.js').BasicAuth} BasicAuth */
/** @typedef {import('./request.js').RequestData} RequestData */
/** @typedef {import('./request.js').PushRequestData} PushRequestData */
/** @typedef {import('./types.js').IdentifierType} IdentifierType */
/** @typedef {import('https').RequestOptions & { region: Region; url?: string }} TrackDefaults */

/** @typedef {Record<string, any>} BatchOperation */

export class TrackClient {
  /** @type {string} */
  siteid;
  /** @type {string} */
  apikey;
  /** @type {TrackDefaults} */
  defaults;
  /** @type {CIORequest} */
  request;
  /** @type {string} */
  trackRoot;
  /** @type {string} */
  trackV2Root;

  /**
   * @param {string} siteid
   * @param {string} apikey
   * @param {Partial<TrackDefaults>} [defaults]
   */
  constructor(siteid, apikey, defaults = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.siteid = siteid;
    this.apikey = apikey;
    this.defaults = /** @type {TrackDefaults} */ ({ ...defaults, region: defaults.region || RegionUS });
    this.request = new CIORequest({ siteid: this.siteid, apikey: this.apikey }, this.defaults);

    this.trackRoot = this.defaults.url ? this.defaults.url : this.defaults.region.trackUrl;
    this.trackV2Root = this.defaults.url
      ? this.defaults.url.replace('/api/v1', '/api/v2')
      : this.defaults.region.trackV2Url;
  }

  /**
   * @param {string | number} customerId
   * @param {RequestData} [data]
   */
  identify(customerId, data = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.put(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}`, data);
  }

  /** @param {string | number} customerId */
  destroy(customerId) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.destroy(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}`);
  }

  /** @param {string | number} customerId */
  suppress(customerId) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/suppress`);
  }

  /** @param {string | number} customerId */
  unsuppress(customerId) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/unsuppress`);
  }

  /**
   * @param {string | number} customerId
   * @param {RequestData} [data]
   */
  track(customerId, data = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/events`, data);
  }

  /**
   * @param {string | number} anonymousId
   * @param {RequestData} [data]
   */
  trackAnonymous(anonymousId, data = {}) {
    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    let payload = { ...data };

    if (!isEmpty(anonymousId)) {
      payload['anonymous_id'] = anonymousId;
    }

    return this.request.post(`${this.trackRoot}/events`, payload);
  }

  /**
   * @param {string | number} customerId
   * @param {string} path
   */
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

  /** @param {PushRequestData} [data] */
  trackPush(data = {}) {
    return this.request.post(`${this.trackRoot}/push/events`, data);
  }

  /**
   * @param {string | number} customerId
   * @param {string} device_id
   * @param {string} platform
   * @param {Record<string, any>} [data]
   */
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

    let { last_used, ...attributes } = data;

    return this.request.put(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/devices`, {
      device: {
        id: device_id,
        platform,
        ...(last_used ? { last_used } : {}),
        ...(Object.keys(attributes).length && { attributes }),
      },
    });
  }

  /**
   * @param {string | number} customerId
   * @param {string | number} deviceToken
   */
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

  /** @param {BatchOperation[]} operations */
  batch(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new MissingParamError('operations');
    }

    return this.request.post(`${this.trackV2Root}/batch`, { batch: operations });
  }

  /**
   * @param {IdentifierType} primaryIdType
   * @param {string | number} primaryId
   * @param {IdentifierType} secondaryIdType
   * @param {string | number} secondaryId
   */
  mergeCustomers(primaryIdType, primaryId, secondaryIdType, secondaryId) {
    if (isEmpty(primaryId)) {
      throw new MissingParamError('primaryId');
    }

    if (isEmpty(secondaryId)) {
      throw new MissingParamError('secondaryId');
    }

    if (!isIdentifierType(primaryIdType) || !isIdentifierType(secondaryIdType)) {
      throw new Error('primaryIdType and secondaryIdType must be one of "id", "cio_id", or "email"');
    }

    return this.request.post(`${this.trackRoot}/merge_customers`, {
      primary: {
        [primaryIdType]: primaryId,
      },
      secondary: {
        [secondaryIdType]: secondaryId,
      },
    });
  }
}
