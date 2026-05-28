const REGION_BRAND = Symbol.for('customerio-node.Region');

export class Region {
  readonly trackUrl: string;
  readonly trackV2Url: string;
  readonly apiUrl: string;
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
