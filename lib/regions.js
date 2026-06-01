const REGION_BRAND = Symbol.for('customerio-node.Region');

export class Region {
  /** @readonly @type {string} */
  trackUrl;
  /** @readonly @type {string} */
  trackV2Url;
  /** @readonly @type {string} */
  apiUrl;
  /** @readonly @type {string} */
  pipelinesUrl;

  /**
   * @param {unknown} instance
   * @returns {instance is Region}
   */
  static [Symbol.hasInstance](instance) {
    return typeof instance === 'object' && instance !== null && /** @type {any} */ (instance)[REGION_BRAND] === true;
  }

  /**
   * @param {string} trackUrl
   * @param {string} apiUrl
   * @param {string} pipelinesUrl
   */
  constructor(trackUrl, apiUrl, pipelinesUrl) {
    Object.defineProperty(this, REGION_BRAND, { value: true });
    this.trackUrl = trackUrl;
    this.trackV2Url = trackUrl.replace('/api/v1', '/api/v2');
    this.apiUrl = apiUrl;
    this.pipelinesUrl = pipelinesUrl;
  }
}

export const RegionUS = new Region(
  'https://track.customer.io/api/v1',
  'https://api.customer.io/v1',
  'https://cdp.customer.io/v1',
);
export const RegionEU = new Region(
  'https://track-eu.customer.io/api/v1',
  'https://api-eu.customer.io/v1',
  'https://cdp-eu.customer.io/v1',
);
