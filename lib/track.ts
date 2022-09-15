import type { RequestOptions } from 'https';
import Request, { BasicAuth, RequestData, PushRequestData } from './request';
import { Region, RegionUS } from './regions';
import { isEmpty } from './utils';
import { IdentifierType } from './types';

type TrackDefaults = RequestOptions & { region: Region; url?: string };

class MissingParamError extends Error {
  constructor(param: string) {
    super(param);
    this.message = `${param} is required`;
  }
}

export class TrackClient {
  siteid: BasicAuth['siteid'];
  apikey: BasicAuth['apikey'];
  defaults: TrackDefaults;
  request: Request;
  trackRoot: string;

  constructor(siteid: BasicAuth['siteid'], apikey: BasicAuth['apikey'], defaults: Partial<TrackDefaults> = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.siteid = siteid;
    this.apikey = apikey;
    this.defaults = { ...defaults, region: defaults.region || RegionUS };
    this.request = new Request({ siteid: this.siteid, apikey: this.apikey }, this.defaults);

    this.trackRoot = this.defaults.url ? this.defaults.url : this.defaults.region.trackUrl;
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
    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    let payload = { ...data};

    if (!isEmpty(anonymousId)) {
      payload["anonymous_id"] = anonymousId;
    }

    return this.request.post(`${this.trackRoot}/events`, payload);
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

  trackPush(data: PushRequestData = {}) {
    return this.request.post(`${this.trackRoot}/push/events`, data);
  }

  addDevice(customerId: string | number, device_id: string, platform: string, data: Record<string, any> = {}) {
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
      device: { id: device_id, platform, last_used, attributes },
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
    primaryIdType: IdentifierType,
    primaryId: string | number,
    secondaryIdType: IdentifierType,
    secondaryId: string | number,
  ) {
    if (isEmpty(primaryId)) {
      throw new MissingParamError('primaryId');
    }

    if (isEmpty(secondaryId)) {
      throw new MissingParamError('secondaryId');
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
