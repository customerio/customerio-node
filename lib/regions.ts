export class Region {
  readonly trackUrl: string;
  readonly trackV2Url: string;
  readonly apiUrl: string;

  constructor(trackUrl: string, apiUrl: string) {
    this.trackUrl = trackUrl;
    this.trackV2Url = trackUrl.replace('/api/v1', '/api/v2');
    this.apiUrl = apiUrl;
  }
}

export const RegionUS = new Region('https://track.customer.io/api/v1', 'https://api.customer.io/v1');
export const RegionEU = new Region('https://track-eu.customer.io/api/v1', 'https://api-eu.customer.io/v1');
