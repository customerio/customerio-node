const REGION_BRAND = Symbol.for('customerio-node.Region');

/**
 * A Customer.io data region. Selects the base URLs used by {@link TrackClient}
 * and {@link APIClient}.
 *
 * Use the pre-defined {@link RegionUS} and {@link RegionEU} constants rather
 * than constructing a `Region` directly.
 */
export class Region {
  /** Base URL for the Track API (basic-auth, site-id/api-key). */
  readonly trackUrl: string;
  /** Base URL for the Track API v2 (batch endpoint). Derived from {@link trackUrl}. */
  readonly trackV2Url: string;
  /** Base URL for the App API (bearer-auth, app key). */
  readonly apiUrl: string;
  /** Base URL for the Pipelines (CDP) API. */
  readonly pipelinesUrl: string;

  static [Symbol.hasInstance](instance: unknown): instance is Region {
    return typeof instance === 'object' && instance !== null && (instance as any)[REGION_BRAND] === true;
  }

  constructor(trackUrl: string, apiUrl: string, pipelinesUrl: string) {
    Object.defineProperty(this, REGION_BRAND, { value: true });
    this.trackUrl = trackUrl;
    this.trackV2Url = trackUrl.replace('/api/v1', '/api/v2');
    this.apiUrl = apiUrl;
    this.pipelinesUrl = pipelinesUrl;
  }
}

/** US data region. Default when no region is specified. */
export const RegionUS = new Region(
  'https://track.customer.io/api/v1',
  'https://api.customer.io/v1',
  'https://cdp.customer.io/v1',
);

/** EU data region. Use this if your Customer.io workspace is hosted in the EU. */
export const RegionEU = new Region(
  'https://track-eu.customer.io/api/v1',
  'https://api-eu.customer.io/v1',
  'https://cdp-eu.customer.io/v1',
);
