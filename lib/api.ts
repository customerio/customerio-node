import type { BearerAuth, RequestData, RequestDefaults, RetryOptions } from './request';
import Request from './request';
import { Region, RegionUS } from './regions';
import {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './api/requests';
import { isEmpty, isIdentifierType, MissingParamError } from './utils';
import type { Filter } from './types';
import { IdentifierType } from './types';

type APIDefaults = RequestDefaults & { region: Region; url?: string; retry?: Partial<RetryOptions> };

type Recipients = Record<string, unknown>;

type BroadcastsAllowedRecipientFieldsKeys = keyof typeof BROADCASTS_ALLOWED_RECIPIENT_FIELDS;

/**
 * Metric to scope a delivery export to. Pass via the `options.metric` field
 * of {@link APIClient.createDeliveriesExport}.
 */
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

/**
 * Optional filters for {@link APIClient.createDeliveriesExport}.
 */
export type DeliveryExportRequestOptions = {
  /** Inclusive start of the window, as a Unix timestamp (seconds). */
  start?: number;
  /** Inclusive end of the window, as a Unix timestamp (seconds). */
  end?: number;
  /** Specific delivery attributes to include in the export. */
  attributes?: string[];
  /** Filter to a single delivery metric. See {@link DeliveryExportMetric}. */
  metric?: DeliveryExportMetric;
  /** When `true`, include draft messages. Defaults to `false`. */
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

/**
 * Client for the Customer.io App API.
 *
 * Authenticates with a bearer App API key. Use this client to send
 * transactional messages, trigger broadcasts, look up customers, and
 * manage exports.
 *
 * Every method rejects with a {@link CustomerIORequestError} when the API
 * returns a non-2xx status.
 *
 * @example
 * ```ts
 * import { APIClient, RegionUS, SendEmailRequest } from 'customerio-node';
 *
 * const api = new APIClient(appKey, { region: RegionUS });
 * await api.sendEmail(new SendEmailRequest({
 *   to: 'a@example.com',
 *   identifiers: { email: 'a@example.com' },
 *   transactional_message_id: 'welcome',
 * }));
 * ```
 */
export class APIClient {
  appKey: BearerAuth;
  defaults: APIDefaults;
  request: Request;
  apiRoot: string;

  /**
   * @param appKey Your Customer.io App API bearer token.
   * @param defaults Optional overrides. Use `region` to select {@link RegionUS} or {@link RegionEU},
   *   `url` to point at a custom host, `timeout` (ms, default `10000`), or any other fetch
   *   {@link RequestDefaults} field — notably `dispatcher` (an undici `Agent` / `ProxyAgent`) for
   *   proxies, custom TLS, or connection keep-alive.
   * @throws If `region` is provided and is not a {@link Region} instance.
   */
  constructor(appKey: BearerAuth, defaults: Partial<APIDefaults> = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.appKey = appKey;
    this.defaults = { ...defaults, region: defaults.region || RegionUS };
    // `region`/`url` are SDK concerns (they select the host); strip them so the
    // transport receives only fetch init. `retry` is handled by `Request`.
    const { region: _region, url: _url, ...requestDefaults } = this.defaults;
    this.request = new Request(this.appKey, requestDefaults);

    this.apiRoot = this.defaults.url ? this.defaults.url : this.defaults.region.apiUrl;
  }

  /**
   * Send a transactional email.
   *
   * @param req A constructed {@link SendEmailRequest} instance.
   * @returns The parsed JSON response body (includes delivery id).
   * @throws {Error} If `req` is not a {@link SendEmailRequest} instance.
   */
  sendEmail(req: SendEmailRequest) {
    if (!(req instanceof SendEmailRequest)) {
      throw new Error('"request" must be an instance of SendEmailRequest');
    }

    return this.request.post(`${this.apiRoot}/send/email`, req.message);
  }

  /**
   * Send a transactional push notification.
   *
   * @param req A constructed {@link SendPushRequest} instance.
   * @returns The parsed JSON response body.
   * @throws {Error} If `req` is not a {@link SendPushRequest} instance.
   */
  sendPush(req: SendPushRequest) {
    if (!(req instanceof SendPushRequest)) {
      throw new Error('"request" must be an instance of SendPushRequest');
    }

    return this.request.post(`${this.apiRoot}/send/push`, req.message);
  }

  /**
   * Send a transactional SMS.
   *
   * @param req A constructed {@link SendSMSRequest} instance.
   * @returns The parsed JSON response body.
   * @throws {Error} If `req` is not a {@link SendSMSRequest} instance.
   */
  sendSMS(req: SendSMSRequest) {
    if (!(req instanceof SendSMSRequest)) {
      throw new Error('"request" must be an instance of SendSMSRequest');
    }

    return this.request.post(`${this.apiRoot}/send/sms`, req.message);
  }

  /**
   * Send a transactional inbox message.
   *
   * @param req A constructed {@link SendInboxMessageRequest} instance.
   * @returns The parsed JSON response body.
   * @throws {Error} If `req` is not a {@link SendInboxMessageRequest} instance.
   */
  sendInboxMessage(req: SendInboxMessageRequest) {
    if (!(req instanceof SendInboxMessageRequest)) {
      throw new Error('"request" must be an instance of SendInboxMessageRequest');
    }

    return this.request.post(`${this.apiRoot}/send/inbox_message`, req.message);
  }

  /**
   * Send a transactional in-app message.
   *
   * @param req A constructed {@link SendInAppRequest} instance.
   * @returns The parsed JSON response body.
   * @throws {Error} If `req` is not a {@link SendInAppRequest} instance.
   */
  sendInApp(req: SendInAppRequest) {
    if (!(req instanceof SendInAppRequest)) {
      throw new Error('"request" must be an instance of SendInAppRequest');
    }

    return this.request.post(`${this.apiRoot}/send/in_app`, req.message);
  }

  /**
   * Look up all people in your workspace with a matching email address.
   *
   * @param email Full email address. Will be URL-encoded.
   * @returns The parsed JSON response body (`{ results: [...] }`).
   * @throws {Error} If `email` is not a non-empty string.
   */
  getCustomersByEmail(email: string) {
    if (typeof email !== 'string' || isEmpty(email)) {
      throw new Error('"email" must be a string');
    }

    return this.request.get(`${this.apiRoot}/customers?email=${encodeURIComponent(email)}`);
  }

  /**
   * Trigger an API-triggered broadcast (campaign).
   *
   * `recipients` may contain one of the special fields `ids`, `emails`,
   * `per_user_data`, or `data_file_url` (with associated `*_ignore_missing` /
   * `email_add_duplicates` flags); when present, that field's allowed
   * companions are forwarded and any other recipients fields are ignored.
   * Otherwise the entire `recipients` object is forwarded verbatim alongside
   * `data` (use this for segment-based recipients).
   *
   * Both `data` and `recipients` are optional; omitting `recipients` sends the
   * broadcast to its configured recipients.
   *
   * @param broadcastId The broadcast (campaign) id.
   * @param data Liquid `data` payload made available to the broadcast template.
   * @param recipients Recipient selector. See above.
   * @returns The parsed JSON response body.
   */
  triggerBroadcast(broadcastId: string | number, data?: RequestData, recipients?: Recipients) {
    let payload: Record<string, unknown> = {};

    if (data && Object.keys(data).length > 0) {
      payload.data = data;
    }

    if (recipients && Object.keys(recipients).length > 0) {
      let customRecipientField = (
        Object.keys(BROADCASTS_ALLOWED_RECIPIENT_FIELDS) as BroadcastsAllowedRecipientFieldsKeys[]
      ).find((field) => recipients[field]);

      if (customRecipientField) {
        payload = Object.assign(payload, filterRecipientsDataForField(recipients, customRecipientField));
      } else {
        payload.recipients = recipients;
      }
    }

    return this.request.post(`${this.apiRoot}/campaigns/${encodeURIComponent(broadcastId)}/triggers`, payload);
  }

  /**
   * List all exports in your workspace.
   *
   * @returns The parsed JSON response body (`{ exports: [...] }`).
   */
  listExports() {
    return this.request.get(`${this.apiRoot}/exports`);
  }

  /**
   * Get metadata for a specific export, including its status.
   *
   * @param id The export id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `id` is empty.
   */
  getExport(id: string | number) {
    if (isEmpty(id)) {
      throw new MissingParamError('id');
    }

    return this.request.get(`${this.apiRoot}/exports/${encodeURIComponent(id)}`);
  }

  /**
   * Get a time-limited download URL for an export.
   *
   * Only meaningful once {@link APIClient.getExport} reports the export as ready.
   *
   * @param id The export id.
   * @returns The parsed JSON response body (`{ link: "..." }`).
   * @throws {MissingParamError} If `id` is empty.
   */
  downloadExport(id: string | number) {
    if (isEmpty(id)) {
      throw new MissingParamError('id');
    }

    return this.request.get(`${this.apiRoot}/exports/${encodeURIComponent(id)}/download`);
  }

  /**
   * Start an export of people matching a filter.
   *
   * @param filters Filter expression (segment / attribute / and / or / not).
   * @returns The parsed JSON response body, including the new export's id.
   * @throws {MissingParamError} If `filters` is `null` or `undefined`.
   */
  createCustomersExport(filters: Filter) {
    if (filters == null) {
      throw new MissingParamError('filters');
    }

    return this.request.post(`${this.apiRoot}/exports/customers`, { filters });
  }

  /**
   * Start an export of delivery telemetry for a given newsletter.
   *
   * @param newsletterId The newsletter id whose deliveries should be exported.
   * @param options Optional filters — see {@link DeliveryExportRequestOptions}.
   * @returns The parsed JSON response body, including the new export's id.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  createDeliveriesExport(newsletterId: number, options?: DeliveryExportRequestOptions) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.post(`${this.apiRoot}/exports/deliveries`, { newsletter_id: newsletterId, ...options });
  }

  /**
   * Get a person's attributes by identifier.
   *
   * @param id The person's identifier value.
   * @param idType Which identifier kind to look up by. Defaults to {@link IdentifierType.Id}.
   * @returns The parsed JSON response body (`{ customer: {...} }`).
   * @throws {MissingParamError} If `id` is empty.
   * @throws {Error} If `idType` is not a valid {@link IdentifierType}.
   */
  getAttributes(id: string | number, idType: IdentifierType = IdentifierType.Id) {
    if (isEmpty(id)) {
      throw new MissingParamError('id');
    }

    if (!isIdentifierType(idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    return this.request.get(`${this.apiRoot}/customers/${encodeURIComponent(id)}/attributes?id_type=${idType}`);
  }
}

export {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './api/requests';
