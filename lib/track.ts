import type { RequestOptions } from 'https';
import Request, { BasicAuth, RequestData } from './request';
import { Region, RegionUS } from './regions';
import { isEmpty } from './utils';

type TrackDefaults = RequestOptions & { region: Region; url?: string; apiUrl?: string };

class MissingParamError extends Error {
  constructor(param: string) {
    super(param);
    this.message = `${param} is required`;
  }
}

export enum Identifier {
  ID = 'id',
  EMAIL = 'email',
  CIOID = 'cio_id',
}

export class TrackClient {
  siteid: BasicAuth['siteid'];
  apikey: BasicAuth['apikey'];
  defaults: TrackDefaults;
  request: Request;
  trackRoot: string;
  apiRoot: string;

  constructor(siteid: BasicAuth['siteid'], apikey: BasicAuth['apikey'], defaults: Partial<TrackDefaults> = {}) {
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

  identify(customerId: string | number, data: RequestData = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.put(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}`, data);
  }

  destroy(customerId: string | number) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.destroy(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}`);
  }

  suppress(customerId: string | number) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/suppress`);
  }

  track(customerId: string | number, data: RequestData = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/events`, data);
  }

  trackAnonymous(anonymousId: string | number, data: RequestData = {}) {
    if (isEmpty(anonymousId)) {
      throw new MissingParamError('anonymousId');
    }

    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    return this.request.post(`${this.trackRoot}/events`, { ...data, anonymous_id: anonymousId });
  }

  trackPageView(customerId: string | number, path: string) {
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

  addDevice(customerId: string | number, device_id: string, platform: string, data = {}) {
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

  deleteDevice(customerId: string | number, deviceToken: string | number) {
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

  mergeCustomers(
    primaryIdType: Identifier,
    primaryId: string | number,
    secondaryIdType: Identifier,
    secondaryId: string | number,
  ) {
    if (isEmpty(primaryId)) {
      throw new MissingParamError('primaryId');
    }

    if (isEmpty(secondaryId)) {
      throw new MissingParamError('secondaryId');
    }

    return this.request.post(`${this.apiRoot}/merge_customers`, {
      primary: {
        [primaryIdType]: primaryId,
      },
      secondary: {
        [secondaryIdType]: secondaryId,
      },
    });
  }
}
