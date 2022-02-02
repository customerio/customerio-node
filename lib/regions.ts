export class Region {
  readonly trackUrl: string;
  readonly apiUrl: string;
  readonly trackPushUrl?: string;

  constructor(trackUrl: string, apiUrl: string, trackPushUrl?: string) {
    this.trackUrl = trackUrl;
    this.apiUrl = apiUrl;
    this.trackPushUrl = trackPushUrl;
  }
}

export const RegionUS = new Region('https://track.customer.io/api/v1', 'https://api.customer.io/v1', 'https://track.customer.io/push');
export const RegionEU = new Region('https://track-eu.customer.io/api/v1', 'https://api-eu.customer.io/v1', 'https://track-eu.customer.io/push');
