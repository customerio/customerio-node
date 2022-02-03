export class Region {
  readonly trackUrl: string;
  readonly apiUrl: string;

  constructor(trackUrl: string, apiUrl: string) {
    this.trackUrl = trackUrl;
    this.apiUrl = apiUrl;
  }
}

export const RegionUS = new Region('https://track.customer.io/api/v1', 'https://api.customer.io/v1');
export const RegionEU = new Region('https://track-eu.customer.io/api/v1', 'https://api-eu.customer.io/v1');
