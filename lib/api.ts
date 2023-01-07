import type { RequestOptions } from 'https';
import Request, { BearerAuth, RequestData } from './request';
import { Region, RegionUS } from './regions';
import { SendEmailRequest } from './api/requests';
import { cleanEmail, isEmpty, isIdentifierType, MissingParamError } from './utils';
import { Filter, IdentifierType } from './types';

type APIDefaults = RequestOptions & { region: Region; url?: string };

type Recipients = Record<string, unknown>;

type BroadcastsAllowedRecipientFieldsKeys = keyof typeof BROADCASTS_ALLOWED_RECIPIENT_FIELDS;

export enum DeliveryExportMetric {
  Created = 'created',
  Attempted = 'attempted',
  Sent = 'sent',
  Delivered = 'delivered',
  Opened = 'opened',
  Clicked = 'clicked',
  Converted = 'converted',
  Bounced = 'bounced',
  Spammed = 'spammed',
  Unsubscribed = 'unsubscribed',
  Dropped = 'dropped',
  Failed = 'failed',
  Undeliverable = 'undeliverable',
}

export type DeliveryExportRequestOptions = {
  start?: number;
  end?: number;
  attributes?: string[];
  metric?: DeliveryExportMetric;
  drafts?: boolean;
};

const BROADCASTS_ALLOWED_RECIPIENT_FIELDS = {
  ids: ['ids', 'id_ignore_missing'],
  emails: ['emails', 'email_ignore_missing', 'email_add_duplicates'],
  per_user_data: ['per_user_data', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
  data_file_url: ['data_file_url', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
};

const filterRecipientsDataForField = (recipients: Recipients, field: BroadcastsAllowedRecipientFieldsKeys) => {
  return BROADCASTS_ALLOWED_RECIPIENT_FIELDS[field].reduce<Record<string, unknown>>((obj, field) => {
    if (!!recipients[field]) {
      obj[field] = recipients[field];
    }
    return obj;
  }, {});
};

export class APIClient {
  appKey: BearerAuth;
  defaults: APIDefaults;
  request: Request;
  apiRoot: string;

  constructor(appKey: BearerAuth, defaults: Partial<APIDefaults> = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.appKey = appKey;
    this.defaults = { ...defaults, region: defaults.region || RegionUS };
    this.request = new Request(this.appKey, this.defaults);

    this.apiRoot = this.defaults.url ? this.defaults.url : this.defaults.region.apiUrl;
  }

  sendEmail(req: SendEmailRequest) {
    if (!(req instanceof SendEmailRequest)) {
      throw new Error('"request" must be an instance of SendEmailRequest');
    }

    return this.request.post(`${this.apiRoot}/send/email`, req.message);
  }

  getCustomersByEmail(email: string) {
    if (typeof email !== 'string' || isEmpty(email)) {
      throw new Error('"email" must be a string');
    }

    return this.request.get(`${this.apiRoot}/customers?email=${cleanEmail(email)}`);
  }

  triggerBroadcast(id: string | number, data: RequestData, recipients: Recipients) {
    let payload = {};
    let customRecipientField = (
      Object.keys(BROADCASTS_ALLOWED_RECIPIENT_FIELDS) as BroadcastsAllowedRecipientFieldsKeys[]
    ).find((field) => recipients[field]);

    if (customRecipientField) {
      payload = Object.assign({ data }, filterRecipientsDataForField(recipients, customRecipientField));
    } else {
      payload = {
        data,
        recipients,
      };
    }

    return this.request.post(`${this.apiRoot}/api/campaigns/${id}/triggers`, payload);
  }

  listExports() {
    return this.request.get(`${this.apiRoot}/exports`);
  }

  getExport(id: string | number) {
    if (isEmpty(id)) {
      throw new MissingParamError('id');
    }

    return this.request.get(`${this.apiRoot}/exports/${id}`);
  }

  downloadExport(id: string | number) {
    if (isEmpty(id)) {
      throw new MissingParamError('id');
    }

    return this.request.get(`${this.apiRoot}/exports/${id}/download`);
  }

  createCustomersExport(filters: Filter) {
    if (isEmpty(filters)) {
      throw new MissingParamError('filters');
    }

    return this.request.post(`${this.apiRoot}/exports/customers`, { filters });
  }

  createDeliveriesExport(newsletterId: number, options?: DeliveryExportRequestOptions) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.post(`${this.apiRoot}/exports/deliveries`, { newsletter_id: newsletterId, ...options });
  }

  getAttributes(id: string | number, idType: IdentifierType = IdentifierType.Id) {
    if (isEmpty(id)) {
      throw new MissingParamError('customerId');
    }

    if (!isIdentifierType(idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    return this.request.get(`${this.apiRoot}/customers/${id}/attributes?id_type=${idType}`);
  }
}

export { SendEmailRequest } from './api/requests';
