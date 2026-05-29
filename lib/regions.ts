const REGION_BRAND = Symbol.for('customerio-node.Region');

export class Region {
  readonly trackUrl: string;
  readonly trackV2Url: string;
  readonly apiUrl: string;
  readonly pipelinesUrl: string;

  static [Symbol.hasInstance](instance: unknown): instance is Region {
    return typeof instance === 'object' && instance !== null && (instance as any)[REGION_BRAND] === true;
  }

  // TODO(v5): make `pipelinesUrl` required and drop the fallback derivation
  // below. Kept optional in v4.x because `Region` is exported and callers may
  // construct it directly with the original two-argument signature.
  constructor(trackUrl: string, apiUrl: string, pipelinesUrl?: string) {
    Object.defineProperty(this, REGION_BRAND, { value: true });
    this.trackUrl = trackUrl;
    this.trackV2Url = trackUrl.replace('/api/v1', '/api/v2');
    this.apiUrl = apiUrl;
    // Fallback: derive the CDP host from the track host, so a legacy
    // `new Region(trackUrl, apiUrl)` call still produces a sensible value.
    this.pipelinesUrl = pipelinesUrl ?? trackUrl.replace('track', 'cdp').replace('/api/v1', '/v1');
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
