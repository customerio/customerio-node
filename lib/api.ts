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
import { isEmpty, isIdentifierType, isObjectIdType, buildQueryString, MissingParamError } from './utils';
import type { Filter } from './types';
import { IdentifierType } from './types';

/** Which identifier kind the values in an object endpoint refer to. */
export type ObjectIdType = 'object_id' | 'cio_object_id';

/** Cursor pagination shared by most App API list endpoints. */
export type PaginationOptions = {
  /** Pagination cursor returned as `next` by a previous page. */
  start?: string;
  /** Maximum number of results to return in the page. */
  limit?: number;
};

/** Options for {@link APIClient.getCustomerActivities}. */
export type CustomerActivitiesOptions = PaginationOptions & {
  /** Which identifier kind `customerId` is. Defaults to the API's default (`id`). */
  idType?: IdentifierType;
  /** Filter to a single activity type (e.g. `attribute_change`, `event`). */
  type?: string;
  /** Filter to activities with this name (e.g. the event name). */
  name?: string;
};

/** Options for {@link APIClient.getCustomerMessages}. */
export type CustomerMessagesOptions = PaginationOptions & {
  idType?: IdentifierType;
  /** Only include messages after this Unix timestamp (seconds). */
  start_ts?: number;
  /** Only include messages before this Unix timestamp (seconds). */
  end_ts?: number;
};

/** Options for {@link APIClient.getCustomerSubscriptionPreferences}. */
export type CustomerSubscriptionPreferencesOptions = {
  idType?: IdentifierType;
  /** IETF language tag used to localize topic names in the response. */
  language?: string;
};

/** Options for {@link APIClient.getObjectRelationships}. */
export type ObjectRelationshipsOptions = PaginationOptions & {
  /** Which identifier kind `objectId` is. Defaults to the API's default (`object_id`). */
  idType?: ObjectIdType;
};

/** Options for {@link APIClient.listActivities}. */
export type ListActivitiesOptions = PaginationOptions & {
  /** Filter to a single activity type. */
  type?: string;
  /** Filter to activities with this name. */
  name?: string;
  /** Include activities from deleted people. */
  deleted?: boolean;
  /** Scope to a single person's activities. */
  customerId?: string | number;
  /** Which identifier kind `customerId` is. */
  idType?: IdentifierType;
};

/** The definition for a new manual segment created via {@link APIClient.createSegment}. */
export type SegmentInput = {
  /** The segment's display name. */
  name: string;
  /** An optional description. */
  description?: string;
};

/** Time unit for metric reports. */
export type MetricsPeriod = 'hours' | 'days' | 'weeks' | 'months';

/** Options for {@link APIClient.getTransactionalMessageMetrics}. */
export type TransactionalMetricsOptions = {
  /** The time unit each step represents. */
  period?: MetricsPeriod;
  /** The number of periods to report over. */
  steps?: number;
};

/** Options for {@link APIClient.getTransactionalMessageLinkMetrics}. */
export type TransactionalLinkMetricsOptions = TransactionalMetricsOptions & {
  /** When `true`, count unique clicks per link rather than total clicks. */
  unique?: boolean;
};

/** Options for {@link APIClient.getTransactionalMessageDeliveries}. */
export type TransactionalDeliveriesOptions = PaginationOptions & {
  /** Filter to deliveries with this metric (e.g. `delivered`, `opened`, `bounced`). */
  metric?: string;
  /** Filter to deliveries in this state. */
  state?: DeliveryState;
  /** Only include deliveries after this Unix timestamp (seconds). */
  start_ts?: number;
  /** Only include deliveries before this Unix timestamp (seconds). */
  end_ts?: number;
  /** When `true`, include tracked responses (reply/click data) on each delivery. */
  get_tracked_responses?: boolean;
};

/** Message channel a metric/message query can be scoped to. */
export type MetricType = 'email' | 'webhook' | 'twilio' | 'whatsapp' | 'slack' | 'push' | 'in_app';

/** Resolution (bucket size) for time-series metric reports. */
export type MetricResolution = 'hours' | 'hourly' | 'days' | 'daily' | 'weeks' | 'weekly' | 'months' | 'monthly';

/** Delivery state a message/delivery listing can be filtered by. */
export type DeliveryState = 'failed' | 'sent' | 'drafted' | 'attempted';

/** Metrics API version for campaign metric reports. */
export type CampaignMetricsVersion = '1' | '2';

/** Options for channel-scoped metric reports (broadcast metrics, action metrics/links). */
export type MetricsOptions = {
  /** The time unit each step represents. */
  period?: MetricsPeriod;
  /** The number of periods to report over. */
  steps?: number;
  /** Scope the report to a single channel. */
  type?: MetricType;
};

/** Options for resource-level link (click) metric reports. */
export type LinkMetricsOptions = {
  period?: MetricsPeriod;
  steps?: number;
  /** When `true`, count unique clicks per link rather than total clicks. */
  unique?: boolean;
};

/** Options for campaign metric reports. Pass the required `version` separately. */
export type CampaignMetricsOptions = {
  /** Scope the report to a single channel. */
  type?: MetricType;
  /** Resolution (bucket size) of the report. */
  res?: MetricResolution;
  /** IANA timezone for bucket boundaries (e.g. `America/New_York`). */
  tz?: string;
  /** Inclusive start of the window, as a Unix timestamp (seconds). */
  start?: number;
  /** Inclusive end of the window, as a Unix timestamp (seconds). */
  end?: number;
  period?: MetricsPeriod;
  steps?: number;
};

/** Required options for {@link APIClient.getCampaignJourneyMetrics}. */
export type JourneyMetricsOptions = {
  /** Inclusive start of the window, as a Unix timestamp (seconds). */
  start: number;
  /** Inclusive end of the window, as a Unix timestamp (seconds). */
  end: number;
  /** Resolution (bucket size) of the report. */
  res: MetricResolution;
};

/** Options for {@link APIClient.getCampaignMessages}. */
export type CampaignMessagesOptions = PaginationOptions & {
  /** Scope to a single channel. */
  type?: MetricType;
  /** Filter to deliveries with this metric (e.g. `delivered`, `opened`, `bounced`). */
  metric?: string;
  /** Include drafted (unsent) messages. */
  drafts?: boolean;
  /** Only include deliveries after this Unix timestamp (seconds). */
  start_ts?: number;
  /** Only include deliveries before this Unix timestamp (seconds). */
  end_ts?: number;
  /** When `true`, include tracked responses on each delivery. */
  get_tracked_responses?: boolean;
};

/** Options for {@link APIClient.getBroadcastMessages}. */
export type BroadcastMessagesOptions = PaginationOptions & {
  /** Filter to deliveries with this metric (e.g. `delivered`, `opened`, `bounced`). */
  metric?: string;
  /** Filter to deliveries in this state. */
  state?: DeliveryState;
  /** Scope to a single channel. */
  type?: MetricType;
  /** Only include deliveries after this Unix timestamp (seconds). */
  start_ts?: number;
  /** Only include deliveries before this Unix timestamp (seconds). */
  end_ts?: number;
  /** When `true`, include tracked responses on each delivery. */
  get_tracked_responses?: boolean;
};

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
   * Note that the parameters are positional: to pass `recipients` without
   * `data`, pass `undefined` for `data` — e.g.
   * `triggerBroadcast(1, undefined, { emails: ['user@example.com'] })`.
   * Passing the recipient selector as the second argument would send it as
   * liquid `data` and trigger the broadcast's configured recipients instead.
   *
   * @param broadcastId The broadcast (campaign) id.
   * @param data Liquid `data` payload made available to the broadcast template.
   * @param recipients Recipient selector. See above.
   * @returns The parsed JSON response body.
   */
  triggerBroadcast(broadcastId: string | number, data?: RequestData, recipients?: Recipients) {
    let payload: Record<string, unknown> = {};

    if (data != null && Object.keys(data).length > 0) {
      payload.data = data;
    }

    if (recipients != null && Object.keys(recipients).length > 0) {
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

  /**
   * Look up a person's activities (events, attribute changes, message activity, …).
   *
   * @param customerId The person's identifier value.
   * @param options Optional filters/pagination. See {@link CustomerActivitiesOptions}.
   * @returns The parsed JSON response body (`{ activities: [...], next }`).
   * @throws {MissingParamError} If `customerId` is empty.
   * @throws {Error} If `options.idType` is provided and is not a valid {@link IdentifierType}.
   */
  getCustomerActivities(customerId: string | number, options: CustomerActivitiesOptions = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (options.idType !== undefined && !isIdentifierType(options.idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    const query = buildQueryString({
      id_type: options.idType,
      start: options.start,
      limit: options.limit,
      type: options.type,
      name: options.name,
    });

    return this.request.get(`${this.apiRoot}/customers/${encodeURIComponent(customerId)}/activities${query}`);
  }

  /**
   * Look up messages sent to a person.
   *
   * @param customerId The person's identifier value.
   * @param options Optional filters/pagination. See {@link CustomerMessagesOptions}.
   * @returns The parsed JSON response body (`{ messages: [...], next }`).
   * @throws {MissingParamError} If `customerId` is empty.
   * @throws {Error} If `options.idType` is provided and is not a valid {@link IdentifierType}.
   */
  getCustomerMessages(customerId: string | number, options: CustomerMessagesOptions = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (options.idType !== undefined && !isIdentifierType(options.idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    const query = buildQueryString({
      id_type: options.idType,
      start: options.start,
      limit: options.limit,
      start_ts: options.start_ts,
      end_ts: options.end_ts,
    });

    return this.request.get(`${this.apiRoot}/customers/${encodeURIComponent(customerId)}/messages${query}`);
  }

  /**
   * Look up a person's relationships to objects.
   *
   * @param customerId The person's identifier value.
   * @param options Optional pagination. See {@link PaginationOptions}.
   * @returns The parsed JSON response body (`{ identifiers: [...], relationships: [...], next }`).
   * @throws {MissingParamError} If `customerId` is empty.
   */
  getCustomerRelationships(customerId: string | number, options: PaginationOptions = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    const query = buildQueryString({ start: options.start, limit: options.limit });

    return this.request.get(`${this.apiRoot}/customers/${encodeURIComponent(customerId)}/relationships${query}`);
  }

  /**
   * Look up the segments a person belongs to.
   *
   * @param customerId The person's identifier value.
   * @param idType Which identifier kind `customerId` is. Defaults to {@link IdentifierType.Id}.
   * @returns The parsed JSON response body (`{ segments: [...] }`).
   * @throws {MissingParamError} If `customerId` is empty.
   * @throws {Error} If `idType` is not a valid {@link IdentifierType}.
   */
  getCustomerSegments(customerId: string | number, idType: IdentifierType = IdentifierType.Id) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (!isIdentifierType(idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    const query = buildQueryString({ id_type: idType });

    return this.request.get(`${this.apiRoot}/customers/${encodeURIComponent(customerId)}/segments${query}`);
  }

  /**
   * Look up a person's subscription (topic) preferences.
   *
   * @param customerId The person's identifier value.
   * @param options Optional identifier kind and localization. See {@link CustomerSubscriptionPreferencesOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId` is empty.
   * @throws {Error} If `options.idType` is provided and is not a valid {@link IdentifierType}.
   */
  getCustomerSubscriptionPreferences(
    customerId: string | number,
    options: CustomerSubscriptionPreferencesOptions = {},
  ) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (options.idType !== undefined && !isIdentifierType(options.idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    const query = buildQueryString({ id_type: options.idType, language: options.language });

    return this.request.get(
      `${this.apiRoot}/customers/${encodeURIComponent(customerId)}/subscription_preferences${query}`,
    );
  }

  /**
   * Search for people matching a filter.
   *
   * @param filter A segment/attribute filter expression (and/or/not). See {@link Filter}.
   * @param options Optional pagination. See {@link PaginationOptions}.
   * @returns The parsed JSON response body (`{ identifiers: [...], ids: [...], next }`).
   * @throws {MissingParamError} If `filter` is `null` or `undefined`.
   */
  searchCustomers(filter: Filter, options: PaginationOptions = {}) {
    if (filter == null) {
      throw new MissingParamError('filter');
    }

    const query = buildQueryString({ start: options.start, limit: options.limit });

    return this.request.post(`${this.apiRoot}/customers${query}`, { filter });
  }

  /**
   * Look up attributes and devices for a set of people in one request.
   *
   * @param ids The identifiers of the people to look up (non-empty).
   * @returns The parsed JSON response body (`{ customers: [...] }`).
   * @throws {MissingParamError} If `ids` is not a non-empty array.
   */
  getCustomersAttributes(ids: Array<string | number>) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new MissingParamError('ids');
    }

    return this.request.post(`${this.apiRoot}/customers/attributes`, { ids });
  }

  /**
   * Get an object's attributes.
   *
   * @param objectTypeId The object type's numeric id.
   * @param objectId The object's identifier value.
   * @param idType Which identifier kind `objectId` is (`object_id` or `cio_object_id`).
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `objectTypeId` or `objectId` is empty.
   */
  getObjectAttributes(objectTypeId: string | number, objectId: string | number, idType?: ObjectIdType) {
    if (isEmpty(objectTypeId)) {
      throw new MissingParamError('objectTypeId');
    }

    if (isEmpty(objectId)) {
      throw new MissingParamError('objectId');
    }

    if (idType !== undefined && !isObjectIdType(idType)) {
      throw new Error('idType must be one of "object_id" or "cio_object_id"');
    }

    const query = buildQueryString({ id_type: idType });

    return this.request.get(
      `${this.apiRoot}/objects/${encodeURIComponent(objectTypeId)}/${encodeURIComponent(objectId)}/attributes${query}`,
    );
  }

  /**
   * Get an object's relationships to people.
   *
   * @param objectTypeId The object type's numeric id.
   * @param objectId The object's identifier value.
   * @param options Optional identifier kind and pagination. See {@link ObjectRelationshipsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `objectTypeId` or `objectId` is empty.
   */
  getObjectRelationships(
    objectTypeId: string | number,
    objectId: string | number,
    options: ObjectRelationshipsOptions = {},
  ) {
    if (isEmpty(objectTypeId)) {
      throw new MissingParamError('objectTypeId');
    }

    if (isEmpty(objectId)) {
      throw new MissingParamError('objectId');
    }

    if (options.idType !== undefined && !isObjectIdType(options.idType)) {
      throw new Error('idType must be one of "object_id" or "cio_object_id"');
    }

    const query = buildQueryString({ id_type: options.idType, start: options.start, limit: options.limit });

    return this.request.get(
      `${this.apiRoot}/objects/${encodeURIComponent(objectTypeId)}/${encodeURIComponent(objectId)}/relationships${query}`,
    );
  }

  /**
   * Find objects of a given type matching a filter.
   *
   * @param objectTypeId The object type's numeric id.
   * @param filter A filter expression (and/or/not).
   * @param options Optional pagination. See {@link PaginationOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `objectTypeId` is empty or `filter` is `null`/`undefined`.
   *
   * @remarks
   * The object filter schema differs from the audience {@link Filter} (it uses
   * `object_attribute` conditions with a `type_id` and has no `segment`). A
   * dedicated `ObjectFilter` type (plus top-level `not` support for both
   * filters) is tracked as a follow-up; for now `filter` is typed loosely as
   * `Record<string, any>` to avoid implying the audience shape is accepted.
   */
  findObjects(objectTypeId: string | number, filter: Record<string, any>, options: PaginationOptions = {}) {
    if (isEmpty(objectTypeId)) {
      throw new MissingParamError('objectTypeId');
    }

    if (filter == null) {
      throw new MissingParamError('filter');
    }

    const query = buildQueryString({ start: options.start, limit: options.limit });

    return this.request.post(`${this.apiRoot}/objects${query}`, { object_type_id: objectTypeId, filter });
  }

  /**
   * List the object types defined in your workspace.
   *
   * @returns The parsed JSON response body (`{ types: [...] }`).
   */
  listObjectTypes() {
    return this.request.get(`${this.apiRoot}/object_types`);
  }

  /**
   * List activities across your workspace.
   *
   * @param options Optional filters/pagination. See {@link ListActivitiesOptions}.
   * @returns The parsed JSON response body (`{ activities: [...], next }`).
   * @throws {Error} If `options.idType` is provided and is not a valid {@link IdentifierType}.
   */
  listActivities(options: ListActivitiesOptions = {}) {
    if (options.idType !== undefined && !isIdentifierType(options.idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    const query = buildQueryString({
      start: options.start,
      limit: options.limit,
      type: options.type,
      name: options.name,
      deleted: options.deleted,
      customer_id: options.customerId,
      id_type: options.idType,
    });

    return this.request.get(`${this.apiRoot}/activities${query}`);
  }

  /**
   * List the segments in your workspace.
   *
   * @returns The parsed JSON response body (`{ segments: [...] }`).
   */
  listSegments() {
    return this.request.get(`${this.apiRoot}/segments`);
  }

  /**
   * Create a manual segment.
   *
   * @param segment The segment definition. `name` is required. See {@link SegmentInput}.
   * @returns The parsed JSON response body (`{ segment: {...} }`).
   * @throws {MissingParamError} If `segment` is missing/not an object, or `segment.name` is empty.
   */
  createSegment(segment: SegmentInput) {
    if (segment == null || typeof segment !== 'object') {
      throw new MissingParamError('segment');
    }

    if (isEmpty(segment.name)) {
      throw new MissingParamError('segment.name');
    }

    return this.request.post(`${this.apiRoot}/segments`, { segment });
  }

  /**
   * Get a single segment's metadata.
   *
   * @param segmentId The segment's numeric id.
   * @returns The parsed JSON response body (`{ segment: {...} }`).
   * @throws {MissingParamError} If `segmentId` is empty.
   */
  getSegment(segmentId: string | number) {
    if (isEmpty(segmentId)) {
      throw new MissingParamError('segmentId');
    }

    return this.request.get(`${this.apiRoot}/segments/${encodeURIComponent(segmentId)}`);
  }

  /**
   * Delete a manual segment.
   *
   * @param segmentId The segment's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `segmentId` is empty.
   */
  deleteSegment(segmentId: string | number) {
    if (isEmpty(segmentId)) {
      throw new MissingParamError('segmentId');
    }

    return this.request.destroy(`${this.apiRoot}/segments/${encodeURIComponent(segmentId)}`);
  }

  /**
   * Get the number of people in a segment.
   *
   * @param segmentId The segment's numeric id.
   * @returns The parsed JSON response body (`{ count, ... }`).
   * @throws {MissingParamError} If `segmentId` is empty.
   */
  getSegmentCustomerCount(segmentId: string | number) {
    if (isEmpty(segmentId)) {
      throw new MissingParamError('segmentId');
    }

    return this.request.get(`${this.apiRoot}/segments/${encodeURIComponent(segmentId)}/customer_count`);
  }

  /**
   * List the people who belong to a segment.
   *
   * @param segmentId The segment's numeric id.
   * @param options Optional pagination. See {@link PaginationOptions}.
   * @returns The parsed JSON response body (`{ ids: [...], identifiers: [...], next }`).
   * @throws {MissingParamError} If `segmentId` is empty.
   */
  getSegmentMembership(segmentId: string | number, options: PaginationOptions = {}) {
    if (isEmpty(segmentId)) {
      throw new MissingParamError('segmentId');
    }

    const query = buildQueryString({ start: options.start, limit: options.limit });

    return this.request.get(`${this.apiRoot}/segments/${encodeURIComponent(segmentId)}/membership${query}`);
  }

  /**
   * Get the campaigns, newsletters, and other resources that use a segment.
   *
   * @param segmentId The segment's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `segmentId` is empty.
   */
  getSegmentUsedBy(segmentId: string | number) {
    if (isEmpty(segmentId)) {
      throw new MissingParamError('segmentId');
    }

    return this.request.get(`${this.apiRoot}/segments/${encodeURIComponent(segmentId)}/used_by`);
  }

  /**
   * List the subscription topics defined in your workspace.
   *
   * @returns The parsed JSON response body (`{ topics: [...] }`).
   */
  listSubscriptionTopics() {
    return this.request.get(`${this.apiRoot}/subscription_topics`);
  }

  /**
   * List the subscription channels configured in your workspace.
   *
   * @returns The parsed JSON response body.
   */
  listSubscriptionChannels() {
    return this.request.get(`${this.apiRoot}/subscription_channels`);
  }

  /**
   * Generate a subscription center token for a person. The token authenticates
   * a hosted subscription-center link so the person can manage their preferences.
   *
   * @param customerId The person's identifier value.
   * @returns The parsed JSON response body (`{ token }`).
   * @throws {MissingParamError} If `customerId` is empty.
   */
  getSubscriptionCenterToken(customerId: string | number) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.get(`${this.apiRoot}/subscription_center/${encodeURIComponent(customerId)}/token`);
  }

  /**
   * List the transactional messages in your workspace.
   *
   * @returns The parsed JSON response body.
   */
  listTransactionalMessages() {
    return this.request.get(`${this.apiRoot}/transactional`);
  }

  /**
   * Get a single transactional message's metadata.
   *
   * @param transactionalId The transactional message's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `transactionalId` is empty.
   */
  getTransactionalMessage(transactionalId: string | number) {
    if (isEmpty(transactionalId)) {
      throw new MissingParamError('transactionalId');
    }

    return this.request.get(`${this.apiRoot}/transactional/${encodeURIComponent(transactionalId)}`);
  }

  /**
   * List all content variants of a transactional message.
   *
   * @param transactionalId The transactional message's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `transactionalId` is empty.
   */
  getTransactionalMessageContents(transactionalId: string | number) {
    if (isEmpty(transactionalId)) {
      throw new MissingParamError('transactionalId');
    }

    return this.request.get(`${this.apiRoot}/transactional/${encodeURIComponent(transactionalId)}/contents`);
  }

  /**
   * Get a single-language translation of a transactional message.
   *
   * @param transactionalId The transactional message's numeric id.
   * @param language The IETF language tag of the translation.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `transactionalId` or `language` is empty.
   */
  getTransactionalMessageLanguage(transactionalId: string | number, language: string) {
    if (isEmpty(transactionalId)) {
      throw new MissingParamError('transactionalId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.get(
      `${this.apiRoot}/transactional/${encodeURIComponent(transactionalId)}/language/${encodeURIComponent(language)}`,
    );
  }

  /**
   * Update a single-language translation of a transactional message.
   *
   * @param transactionalId The transactional message's numeric id.
   * @param language The IETF language tag of the translation.
   * @param data The translation fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `transactionalId` or `language` is empty.
   */
  updateTransactionalMessageLanguage(transactionalId: string | number, language: string, data: RequestData = {}) {
    if (isEmpty(transactionalId)) {
      throw new MissingParamError('transactionalId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.put(
      `${this.apiRoot}/transactional/${encodeURIComponent(transactionalId)}/language/${encodeURIComponent(language)}`,
      data,
    );
  }

  /**
   * Get the individual deliveries (sends) of a transactional message.
   *
   * @param transactionalId The transactional message's numeric id.
   * @param options Optional filters/pagination. See {@link TransactionalDeliveriesOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `transactionalId` is empty.
   */
  getTransactionalMessageDeliveries(transactionalId: string | number, options: TransactionalDeliveriesOptions = {}) {
    if (isEmpty(transactionalId)) {
      throw new MissingParamError('transactionalId');
    }

    const query = buildQueryString({
      start: options.start,
      limit: options.limit,
      metric: options.metric,
      state: options.state,
      start_ts: options.start_ts,
      end_ts: options.end_ts,
      get_tracked_responses: options.get_tracked_responses,
    });

    return this.request.get(`${this.apiRoot}/transactional/${encodeURIComponent(transactionalId)}/messages${query}`);
  }

  /**
   * Get delivery metrics for a transactional message over time.
   *
   * @param transactionalId The transactional message's numeric id.
   * @param options Optional reporting window. See {@link TransactionalMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `transactionalId` is empty.
   */
  getTransactionalMessageMetrics(transactionalId: string | number, options: TransactionalMetricsOptions = {}) {
    if (isEmpty(transactionalId)) {
      throw new MissingParamError('transactionalId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps });

    return this.request.get(`${this.apiRoot}/transactional/${encodeURIComponent(transactionalId)}/metrics${query}`);
  }

  /**
   * Get link (click) metrics for a transactional message over time.
   *
   * @param transactionalId The transactional message's numeric id.
   * @param options Optional reporting window. See {@link TransactionalLinkMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `transactionalId` is empty.
   */
  getTransactionalMessageLinkMetrics(transactionalId: string | number, options: TransactionalLinkMetricsOptions = {}) {
    if (isEmpty(transactionalId)) {
      throw new MissingParamError('transactionalId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, unique: options.unique });

    return this.request.get(
      `${this.apiRoot}/transactional/${encodeURIComponent(transactionalId)}/metrics/links${query}`,
    );
  }

  /**
   * Update a transactional message's content variant.
   *
   * @param transactionalId The transactional message's numeric id.
   * @param contentId The content variant's numeric id.
   * @param data The content fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `transactionalId` or `contentId` is empty.
   */
  updateTransactionalMessageContent(
    transactionalId: string | number,
    contentId: string | number,
    data: RequestData = {},
  ) {
    if (isEmpty(transactionalId)) {
      throw new MissingParamError('transactionalId');
    }

    if (isEmpty(contentId)) {
      throw new MissingParamError('contentId');
    }

    return this.request.put(
      `${this.apiRoot}/transactional/${encodeURIComponent(transactionalId)}/content/${encodeURIComponent(contentId)}`,
      data,
    );
  }

  /**
   * Build the base URL for a campaign/broadcast resource. Shared by the
   * campaign and broadcast methods, which have identical sub-resource paths.
   */
  private resourceBase(resource: 'campaigns' | 'broadcasts', id: string | number) {
    return `${this.apiRoot}/${resource}/${encodeURIComponent(id)}`;
  }

  /**
   * List the campaigns in your workspace.
   *
   * @returns The parsed JSON response body (`{ campaigns: [...] }`).
   */
  listCampaigns() {
    return this.request.get(`${this.apiRoot}/campaigns`);
  }

  /**
   * Get a single campaign's metadata.
   *
   * @param campaignId The campaign's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` is empty.
   */
  getCampaign(campaignId: string | number) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    return this.request.get(this.resourceBase('campaigns', campaignId));
  }

  /**
   * List a campaign's actions.
   *
   * @param campaignId The campaign's numeric id.
   * @param options Optional pagination cursor (`start`).
   * @returns The parsed JSON response body (`{ actions: [...], next }`).
   * @throws {MissingParamError} If `campaignId` is empty.
   */
  getCampaignActions(campaignId: string | number, options: { start?: string } = {}) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    const query = buildQueryString({ start: options.start });

    return this.request.get(`${this.resourceBase('campaigns', campaignId)}/actions${query}`);
  }

  /**
   * Get a single action of a campaign.
   *
   * @param campaignId The campaign's numeric id.
   * @param actionId The action's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` or `actionId` is empty.
   */
  getCampaignAction(campaignId: string | number, actionId: string | number) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    return this.request.get(`${this.resourceBase('campaigns', campaignId)}/actions/${encodeURIComponent(actionId)}`);
  }

  /**
   * Update an action of a campaign (e.g. its message content).
   *
   * @param campaignId The campaign's numeric id.
   * @param actionId The action's numeric id.
   * @param data The action fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` or `actionId` is empty.
   */
  updateCampaignAction(campaignId: string | number, actionId: string | number, data: RequestData = {}) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    return this.request.put(
      `${this.resourceBase('campaigns', campaignId)}/actions/${encodeURIComponent(actionId)}`,
      data,
    );
  }

  /**
   * Get a single-language translation of a campaign action.
   *
   * @param campaignId The campaign's numeric id.
   * @param actionId The action's numeric id.
   * @param language The IETF language tag.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId`, `actionId`, or `language` is empty.
   */
  getCampaignActionLanguage(campaignId: string | number, actionId: string | number, language: string) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.get(
      `${this.resourceBase('campaigns', campaignId)}/actions/${encodeURIComponent(actionId)}/language/${encodeURIComponent(language)}`,
    );
  }

  /**
   * Update a single-language translation of a campaign action.
   *
   * @param campaignId The campaign's numeric id.
   * @param actionId The action's numeric id.
   * @param language The IETF language tag.
   * @param data The translation fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId`, `actionId`, or `language` is empty.
   */
  updateCampaignActionLanguage(
    campaignId: string | number,
    actionId: string | number,
    language: string,
    data: RequestData = {},
  ) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.put(
      `${this.resourceBase('campaigns', campaignId)}/actions/${encodeURIComponent(actionId)}/language/${encodeURIComponent(language)}`,
      data,
    );
  }

  /**
   * Get metrics for a single campaign action over time.
   *
   * @param campaignId The campaign's numeric id.
   * @param actionId The action's numeric id.
   * @param version The metrics API version (`"1"` or `"2"`) — required by the API.
   * @param options Optional reporting window/filters. See {@link CampaignMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId`, `actionId`, or `version` is empty.
   */
  getCampaignActionMetrics(
    campaignId: string | number,
    actionId: string | number,
    version: CampaignMetricsVersion,
    options: CampaignMetricsOptions = {},
  ) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    if (isEmpty(version)) {
      throw new MissingParamError('version');
    }

    const query = buildQueryString({
      version,
      type: options.type,
      res: options.res,
      tz: options.tz,
      start: options.start,
      end: options.end,
      period: options.period,
      steps: options.steps,
    });

    return this.request.get(
      `${this.resourceBase('campaigns', campaignId)}/actions/${encodeURIComponent(actionId)}/metrics${query}`,
    );
  }

  /**
   * Get link (click) metrics for a single campaign action over time.
   *
   * @param campaignId The campaign's numeric id.
   * @param actionId The action's numeric id.
   * @param options Optional reporting window/filters. See {@link MetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` or `actionId` is empty.
   */
  getCampaignActionMetricsLinks(campaignId: string | number, actionId: string | number, options: MetricsOptions = {}) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, type: options.type });

    return this.request.get(
      `${this.resourceBase('campaigns', campaignId)}/actions/${encodeURIComponent(actionId)}/metrics/links${query}`,
    );
  }

  /**
   * Get delivery metrics for a campaign over time.
   *
   * @param campaignId The campaign's numeric id.
   * @param version The metrics API version (`"1"` or `"2"`) — required by the API.
   * @param options Optional reporting window/filters. See {@link CampaignMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` or `version` is empty.
   */
  getCampaignMetrics(
    campaignId: string | number,
    version: CampaignMetricsVersion,
    options: CampaignMetricsOptions = {},
  ) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(version)) {
      throw new MissingParamError('version');
    }

    const query = buildQueryString({
      version,
      type: options.type,
      res: options.res,
      tz: options.tz,
      start: options.start,
      end: options.end,
      period: options.period,
      steps: options.steps,
    });

    return this.request.get(`${this.resourceBase('campaigns', campaignId)}/metrics${query}`);
  }

  /**
   * Get link (click) metrics for a campaign over time.
   *
   * @param campaignId The campaign's numeric id.
   * @param options Optional reporting window. See {@link LinkMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` is empty.
   */
  getCampaignMetricsLinks(campaignId: string | number, options: LinkMetricsOptions = {}) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, unique: options.unique });

    return this.request.get(`${this.resourceBase('campaigns', campaignId)}/metrics/links${query}`);
  }

  /**
   * Get a campaign's journey metrics (per-step conversion funnel) over a window.
   *
   * @param campaignId The campaign's numeric id.
   * @param options Required window and resolution. See {@link JourneyMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId`, `options.start`, `options.end`, or `options.res` is empty.
   */
  getCampaignJourneyMetrics(campaignId: string | number, options: JourneyMetricsOptions) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (options == null || isEmpty(options.start)) {
      throw new MissingParamError('options.start');
    }

    if (isEmpty(options.end)) {
      throw new MissingParamError('options.end');
    }

    if (isEmpty(options.res)) {
      throw new MissingParamError('options.res');
    }

    const query = buildQueryString({ start: options.start, end: options.end, res: options.res });

    return this.request.get(`${this.resourceBase('campaigns', campaignId)}/journey_metrics${query}`);
  }

  /**
   * Get the individual messages (deliveries) sent by a campaign.
   *
   * @param campaignId The campaign's numeric id.
   * @param options Optional filters/pagination. See {@link CampaignMessagesOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` is empty.
   */
  getCampaignMessages(campaignId: string | number, options: CampaignMessagesOptions = {}) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    const query = buildQueryString({
      start: options.start,
      limit: options.limit,
      type: options.type,
      metric: options.metric,
      drafts: options.drafts,
      start_ts: options.start_ts,
      end_ts: options.end_ts,
      get_tracked_responses: options.get_tracked_responses,
    });

    return this.request.get(`${this.resourceBase('campaigns', campaignId)}/messages${query}`);
  }

  /**
   * Get the status of an API-triggered broadcast run. Pairs with {@link APIClient.triggerBroadcast}.
   *
   * @param broadcastId The broadcast (campaign) id.
   * @param triggerId The trigger id returned by `triggerBroadcast`.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` or `triggerId` is empty.
   */
  getBroadcastTriggerStatus(broadcastId: string | number, triggerId: string | number) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(triggerId)) {
      throw new MissingParamError('triggerId');
    }

    return this.request.get(
      `${this.apiRoot}/campaigns/${encodeURIComponent(broadcastId)}/triggers/${encodeURIComponent(triggerId)}`,
    );
  }

  /**
   * Get the per-recipient errors for an API-triggered broadcast run.
   *
   * @param broadcastId The broadcast (campaign) id.
   * @param triggerId The trigger id returned by `triggerBroadcast`.
   * @param options Optional pagination. See {@link PaginationOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` or `triggerId` is empty.
   */
  getBroadcastTriggerErrors(broadcastId: string | number, triggerId: string | number, options: PaginationOptions = {}) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(triggerId)) {
      throw new MissingParamError('triggerId');
    }

    const query = buildQueryString({ start: options.start, limit: options.limit });

    return this.request.get(
      `${this.apiRoot}/campaigns/${encodeURIComponent(broadcastId)}/triggers/${encodeURIComponent(triggerId)}/errors${query}`,
    );
  }

  /**
   * List the broadcasts in your workspace.
   *
   * @returns The parsed JSON response body (`{ broadcasts: [...] }`).
   */
  listBroadcasts() {
    return this.request.get(`${this.apiRoot}/broadcasts`);
  }

  /**
   * Get a single broadcast's metadata.
   *
   * @param broadcastId The broadcast's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` is empty.
   */
  getBroadcast(broadcastId: string | number) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    return this.request.get(this.resourceBase('broadcasts', broadcastId));
  }

  /**
   * List a broadcast's actions.
   *
   * @param broadcastId The broadcast's numeric id.
   * @returns The parsed JSON response body (`{ actions: [...] }`).
   * @throws {MissingParamError} If `broadcastId` is empty.
   */
  getBroadcastActions(broadcastId: string | number) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    return this.request.get(`${this.resourceBase('broadcasts', broadcastId)}/actions`);
  }

  /**
   * Get a single action of a broadcast.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param actionId The action's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` or `actionId` is empty.
   */
  getBroadcastAction(broadcastId: string | number, actionId: string | number) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    return this.request.get(`${this.resourceBase('broadcasts', broadcastId)}/actions/${encodeURIComponent(actionId)}`);
  }

  /**
   * Update an action of a broadcast (e.g. its message content).
   *
   * @param broadcastId The broadcast's numeric id.
   * @param actionId The action's numeric id.
   * @param data The action fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` or `actionId` is empty.
   */
  updateBroadcastAction(broadcastId: string | number, actionId: string | number, data: RequestData = {}) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    return this.request.put(
      `${this.resourceBase('broadcasts', broadcastId)}/actions/${encodeURIComponent(actionId)}`,
      data,
    );
  }

  /**
   * Get a single-language translation of a broadcast action.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param actionId The action's numeric id.
   * @param language The IETF language tag.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId`, `actionId`, or `language` is empty.
   */
  getBroadcastActionLanguage(broadcastId: string | number, actionId: string | number, language: string) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.get(
      `${this.resourceBase('broadcasts', broadcastId)}/actions/${encodeURIComponent(actionId)}/language/${encodeURIComponent(language)}`,
    );
  }

  /**
   * Update a single-language translation of a broadcast action.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param actionId The action's numeric id.
   * @param language The IETF language tag.
   * @param data The translation fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId`, `actionId`, or `language` is empty.
   */
  updateBroadcastActionLanguage(
    broadcastId: string | number,
    actionId: string | number,
    language: string,
    data: RequestData = {},
  ) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.put(
      `${this.resourceBase('broadcasts', broadcastId)}/actions/${encodeURIComponent(actionId)}/language/${encodeURIComponent(language)}`,
      data,
    );
  }

  /**
   * Get metrics for a single broadcast action over time.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param actionId The action's numeric id.
   * @param options Optional reporting window/filters. See {@link MetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` or `actionId` is empty.
   */
  getBroadcastActionMetrics(broadcastId: string | number, actionId: string | number, options: MetricsOptions = {}) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, type: options.type });

    return this.request.get(
      `${this.resourceBase('broadcasts', broadcastId)}/actions/${encodeURIComponent(actionId)}/metrics${query}`,
    );
  }

  /**
   * Get link (click) metrics for a single broadcast action over time.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param actionId The action's numeric id.
   * @param options Optional reporting window/filters. See {@link MetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` or `actionId` is empty.
   */
  getBroadcastActionMetricsLinks(
    broadcastId: string | number,
    actionId: string | number,
    options: MetricsOptions = {},
  ) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, type: options.type });

    return this.request.get(
      `${this.resourceBase('broadcasts', broadcastId)}/actions/${encodeURIComponent(actionId)}/metrics/links${query}`,
    );
  }

  /**
   * Get delivery metrics for a broadcast over time.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param options Optional reporting window/filters. See {@link MetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` is empty.
   */
  getBroadcastMetrics(broadcastId: string | number, options: MetricsOptions = {}) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, type: options.type });

    return this.request.get(`${this.resourceBase('broadcasts', broadcastId)}/metrics${query}`);
  }

  /**
   * Get link (click) metrics for a broadcast over time.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param options Optional reporting window. See {@link LinkMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` is empty.
   */
  getBroadcastMetricsLinks(broadcastId: string | number, options: LinkMetricsOptions = {}) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, unique: options.unique });

    return this.request.get(`${this.resourceBase('broadcasts', broadcastId)}/metrics/links${query}`);
  }

  /**
   * Get the individual messages (deliveries) sent by a broadcast.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param options Optional filters/pagination. See {@link BroadcastMessagesOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` is empty.
   */
  getBroadcastMessages(broadcastId: string | number, options: BroadcastMessagesOptions = {}) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    const query = buildQueryString({
      start: options.start,
      limit: options.limit,
      metric: options.metric,
      state: options.state,
      type: options.type,
      start_ts: options.start_ts,
      end_ts: options.end_ts,
      get_tracked_responses: options.get_tracked_responses,
    });

    return this.request.get(`${this.resourceBase('broadcasts', broadcastId)}/messages${query}`);
  }

  /**
   * List the API triggers fired for a broadcast.
   *
   * @param broadcastId The broadcast's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` is empty.
   */
  getBroadcastTriggers(broadcastId: string | number) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    return this.request.get(`${this.resourceBase('broadcasts', broadcastId)}/triggers`);
  }
}

export {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './api/requests';
