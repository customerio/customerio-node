export class Region {
  readonly trackUrl: string;
  readonly apiUrl: string;
  readonly apiBetaUrl: string;

  constructor(trackUrl: string, apiUrl: string, apiBetaUrl: string) {
    this.trackUrl = trackUrl;
    this.apiUrl = apiUrl;
    this.apiBetaUrl = apiBetaUrl;
  }
}

export const RegionUS = new Region(
  'https://track.customer.io/api/v1',
  'https://api.customer.io/v1',
  'https://beta-api.customer.io/v1/api',
);
export const RegionEU = new Region(
  'https://track-eu.customer.io/api/v1',
  'https://api-eu.customer.io/v1',
  'https://beta-api.customer.io/v1/api',
);
