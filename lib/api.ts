import type { BearerAuth, RequestData, RequestDefaults, RetryOptions } from './request';
import Request from './request';
import { Region, RegionUS } from './regions';
import {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendWhatsAppRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './api/requests';
import { isEmpty, isIdentifierType, isObjectIdType, buildQueryString, MissingParamError } from './utils';
import type { Filter, ObjectFilter } from './types';
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

/** Metrics API version for campaign metric reports. */
export type CampaignMetricsVersion = '1' | '2';

/** Reporting window shared by all metric reports. */
export type MetricsWindowOptions = {
  /** The time unit each step represents. */
  period?: MetricsPeriod;
  /** The number of periods to report over. */
  steps?: number;
};

/** Options for channel-scoped metric reports (e.g. broadcast/campaign resource metrics). */
export type MetricsOptions = MetricsWindowOptions & {
  /** Scope the report to a single channel. */
  type?: MetricType;
};

/** Options for link (click) metric reports. */
export type LinkMetricsOptions = MetricsWindowOptions & {
  /** When `true`, count unique clicks per link rather than total clicks. */
  unique?: boolean;
};

/** Options for campaign resource metric reports. */
export type CampaignMetricsOptions = MetricsWindowOptions & {
  /** Metrics API version (`"1"` or `"2"`). Optional; the API defaults it. */
  version?: CampaignMetricsVersion;
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
};

/**
 * Options for campaign action metric reports. Like {@link CampaignMetricsOptions}
 * but without `type` — action metrics are always aggregated across all channels.
 */
export type CampaignActionMetricsOptions = MetricsWindowOptions & {
  /** Metrics API version (`"1"` or `"2"`). Optional; the API defaults it. */
  version?: CampaignMetricsVersion;
  /** Resolution (bucket size) of the report. */
  res?: MetricResolution;
  /** IANA timezone for bucket boundaries (e.g. `America/New_York`). */
  tz?: string;
  /** Inclusive start of the window, as a Unix timestamp (seconds). */
  start?: number;
  /** Inclusive end of the window, as a Unix timestamp (seconds). */
  end?: number;
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
  /** Scope to a single channel. */
  type?: MetricType;
  /** Only include deliveries after this Unix timestamp (seconds). */
  start_ts?: number;
  /** Only include deliveries before this Unix timestamp (seconds). */
  end_ts?: number;
  /** When `true`, include tracked responses on each delivery. */
  get_tracked_responses?: boolean;
};

/** Sort direction for list endpoints that support it. */
export type SortDirection = 'asc' | 'desc';

/** Options for {@link APIClient.listNewsletters}. */
export type ListNewslettersOptions = PaginationOptions & {
  /** Sort order by creation time. */
  sort?: SortDirection;
};

/**
 * Message channel a newsletter can be scoped to. Newsletters support a slightly
 * different channel set than campaigns/broadcasts (notably `inbox`, and no
 * `whatsapp`/`slack`).
 */
export type NewsletterChannelType = 'email' | 'webhook' | 'twilio' | 'push' | 'in_app' | 'inbox';

/**
 * Options for newsletter metric reports (newsletter + content level).
 *
 * Note: newsletter metrics are always aggregated across all channels — the API
 * does not accept a channel `type` filter here (unlike campaigns/broadcasts).
 */
export type NewsletterMetricsOptions = {
  period?: MetricsPeriod;
  steps?: number;
};

/** Options for {@link APIClient.getNewsletterMessages}. */
export type NewsletterMessagesOptions = PaginationOptions & {
  /** Filter to deliveries with this metric (e.g. `delivered`, `opened`, `bounced`). */
  metric?: string;
  /** Scope to a single channel. */
  type?: NewsletterChannelType;
  /** Only include deliveries after this Unix timestamp (seconds). */
  start_ts?: number;
  /** Only include deliveries before this Unix timestamp (seconds). */
  end_ts?: number;
  /** When `true`, include tracked responses on each delivery. */
  get_tracked_responses?: boolean;
};

/** Sort field for Design Studio list endpoints. */
export type DesignStudioSortBy = 'created' | 'updated' | 'name';

/** Filters, sorting, and pagination shared by the Design Studio list endpoints (page-based, not cursor-based). */
export type DesignStudioListOptions = {
  /** Only list nodes directly within this folder (omit for the root). */
  parentFolderId?: string;
  /** When `true`, return only direct children rather than the whole subtree. */
  directDescendantsOnly?: boolean;
  /** Field to sort by. Defaults to `created`. */
  sortBy?: DesignStudioSortBy;
  /** Sort direction. Defaults to `asc`. */
  sortOrder?: SortDirection;
  /** Only nodes created before this Unix timestamp (seconds). */
  createdBefore?: number;
  /** Only nodes created after this Unix timestamp (seconds). */
  createdAfter?: number;
  /** Only nodes updated before this Unix timestamp (seconds). */
  updatedBefore?: number;
  /** Only nodes updated after this Unix timestamp (seconds). */
  updatedAfter?: number;
  /** 1-based page number. Defaults to 1. */
  page?: number;
  /** Page size, 1–10000. Defaults to 1000. */
  limit?: number;
};

/** Tri-state filter for {@link ListDesignStudioEmailsOptions}: `'true'`/`'false'` to filter, or `'any'` for no filter. */
export type DesignStudioEmailFilter = 'true' | 'false' | 'any';

/** Options for {@link APIClient.listDesignStudioEmails}. */
export type ListDesignStudioEmailsOptions = DesignStudioListOptions & {
  /** Filter by the template flag, or `'any'`. */
  isTemplate?: DesignStudioEmailFilter;
  /** Filter by the presence of translations, or `'any'`. */
  hasTranslations?: DesignStudioEmailFilter;
  /** Filter by linked-to-a-message status, or `'any'`. */
  isLinked?: DesignStudioEmailFilter;
};

/** The `content` block of a Design Studio email. */
export type DesignStudioEmailContent = {
  subject?: string;
  preheader_text?: string;
  html?: string;
  amp?: string;
  text?: string;
};

/** The `envelope` block of a Design Studio email. */
export type DesignStudioEmailEnvelope = {
  from_id?: number;
  reply_to_id?: number;
  recipient?: string;
  bcc?: string;
  fake_bcc?: boolean;
  cc?: string;
  headers?: Array<Record<string, any>>;
};

/** Definition for creating a Design Studio email via {@link APIClient.createDesignStudioEmail}. */
export type DesignStudioEmailInput = {
  /** The email's display name (required). */
  name: string;
  /** Parent folder UUID. Omit or pass `null` for the root. */
  parent_folder_id?: string | null;
  /** Whether the email is a reusable template. */
  is_template?: boolean;
  content?: DesignStudioEmailContent;
  envelope?: DesignStudioEmailEnvelope;
  /** Content transformers (e.g. `url_parameters`, `css_inliner`, `accessibility`). */
  transformers?: Record<string, any>;
};

/**
 * Fields for updating a Design Studio email via {@link APIClient.updateDesignStudioEmail}.
 * At least one must be provided. `parent_folder_id` is tri-state: omit to keep the current
 * parent, `null` to move to the root, or a UUID to move into that folder.
 */
export type DesignStudioEmailUpdate = {
  name?: string;
  parent_folder_id?: string | null;
  is_template?: boolean;
  content?: DesignStudioEmailContent;
  envelope?: DesignStudioEmailEnvelope;
  transformers?: Record<string, any>;
};

/** Definition for creating a Design Studio folder via {@link APIClient.createDesignStudioFolder}. */
export type DesignStudioFolderInput = {
  /** The folder's display name (required). */
  name: string;
  /** Parent folder UUID. Omit or pass `null` for the root. */
  parent_folder_id?: string | null;
};

/**
 * Fields for updating a Design Studio folder via {@link APIClient.updateDesignStudioFolder}.
 * At least one must be provided. `parent_folder_id` is tri-state: omit to keep the current
 * parent, `null` to move to the root, or a UUID to move into that folder.
 */
export type DesignStudioFolderUpdate = {
  name?: string;
  parent_folder_id?: string | null;
};

/** Definition for creating a Design Studio email translation via {@link APIClient.createDesignStudioEmailLanguage}. */
export type DesignStudioEmailTranslationInput = {
  /** IETF language tag for the translation (required). */
  language: string;
  /** Content overrides. Omitted blocks are inherited from the default-language email. */
  content?: DesignStudioEmailContent;
  envelope?: DesignStudioEmailEnvelope;
  transformers?: Record<string, any>;
};

/**
 * Fields for updating a Design Studio email translation via {@link APIClient.updateDesignStudioEmailLanguage}.
 * At least one must be provided. The language itself is immutable (taken from the path).
 */
export type DesignStudioEmailTranslationUpdate = {
  content?: DesignStudioEmailContent;
  envelope?: DesignStudioEmailEnvelope;
  transformers?: Record<string, any>;
};

/** Options for {@link APIClient.listDesignStudioComponents}. */
export type ListDesignStudioComponentsOptions = DesignStudioListOptions & {
  /** Only list components with this tag. */
  tag?: string;
};

/** Definition for creating a Design Studio component via {@link APIClient.createDesignStudioComponent}. */
export type DesignStudioComponentInput = {
  /** The component's display name (required). */
  name: string;
  /** The component's tag — unique per workspace (required). */
  tag: string;
  /** Parent folder UUID. Omit or pass `null` for the root. */
  parent_folder_id?: string | null;
  /** The component's HTML content. */
  content?: string;
};

/**
 * Fields for updating a Design Studio component via {@link APIClient.updateDesignStudioComponent}.
 * At least one must be provided. `parent_folder_id` is tri-state: omit to keep the current parent,
 * `null` to move to the root, or a UUID to move into that folder.
 */
export type DesignStudioComponentUpdate = {
  name?: string;
  tag?: string;
  parent_folder_id?: string | null;
  content?: string;
};

/** Filters and pagination shared by the asset list endpoints (page-based). */
export type AssetListOptions = {
  /** Only list assets directly within this folder id (omit for all/root). */
  parentFolderId?: number;
  /** When `true`, return only direct children rather than the whole subtree. */
  directDescendantsOnly?: boolean;
  /** 1-based page number. Defaults to 1. */
  page?: number;
  /** Page size, 1–10000. Defaults to 1000. */
  limit?: number;
};

/**
 * Definition for uploading a file via {@link APIClient.createAsset}.
 *
 * The API accepts images (`image/bmp`, `image/jpeg`, `image/jpg`, `image/png`,
 * `image/gif`) and `application/pdf`, up to 2 MB (images max 4096px per side).
 */
export type CreateAssetInput = {
  /** File contents. Any `Buffer.from`/`Blob`-compatible value (Buffer, Uint8Array, ArrayBuffer, string). */
  data: any;
  /** Filename — also the multipart filename, the default asset `name`, and the source for the derived content type. */
  filename: string;
  /** MIME type of the upload. When omitted, the API derives it from `filename`. */
  contentType?: string;
  /** Asset name. Defaults to `filename`. */
  name?: string;
  /** Parent folder id. Omit for the root. */
  parentFolderId?: number;
};

/**
 * Fields for updating an asset via {@link APIClient.updateAsset}. At least one must be provided;
 * file bytes cannot be changed. `parent_folder_id` is tri-state: omit to keep the current parent,
 * `null` to move to the root, or a folder id to move it into that folder.
 */
export type AssetUpdate = {
  name?: string;
  parent_folder_id?: number | null;
};

/** Definition for creating an asset folder via {@link APIClient.createAssetFolder}. */
export type AssetFolderInput = {
  /** The folder's display name (required). */
  name: string;
  /** Parent folder id. Omit for the root. */
  parent_folder_id?: number;
};

/**
 * Fields for updating an asset folder via {@link APIClient.updateAssetFolder}. At least one must
 * be provided. `parent_folder_id` is tri-state: omit to keep the current parent, `null` to move to
 * the root, or a folder id to move it into that folder.
 */
export type AssetFolderUpdate = {
  name?: string;
  parent_folder_id?: number | null;
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
   * Send a transactional WhatsApp message.
   *
   * @param req A constructed {@link SendWhatsAppRequest} instance.
   * @returns The parsed JSON response body.
   * @throws {Error} If `req` is not a {@link SendWhatsAppRequest} instance.
   */
  sendWhatsApp(req: SendWhatsAppRequest) {
    if (!(req instanceof SendWhatsAppRequest)) {
      throw new Error('"request" must be an instance of SendWhatsAppRequest');
    }

    return this.request.post(`${this.apiRoot}/send/whatsapp`, req.message);
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
   * @returns The parsed JSON response body (`{ url: "..." }`).
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
   * @param filter An {@link ObjectFilter} expression — `object_attribute` leaf
   *   conditions composed with `and` / `or` / `not`.
   * @param options Optional pagination. See {@link PaginationOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `objectTypeId` is empty or `filter` is `null`/`undefined`.
   */
  findObjects(objectTypeId: string | number, filter: ObjectFilter, options: PaginationOptions = {}) {
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
  private resourceBase(resource: 'campaigns' | 'broadcasts' | 'newsletters', id: string | number) {
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
   * Get metrics for a single campaign action over time. Aggregated across all
   * channels (the API does not accept a `type` filter here).
   *
   * @param campaignId The campaign's numeric id.
   * @param actionId The action's numeric id.
   * @param options Optional reporting window/version. See {@link CampaignActionMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` or `actionId` is empty.
   */
  getCampaignActionMetrics(
    campaignId: string | number,
    actionId: string | number,
    options: CampaignActionMetricsOptions = {},
  ) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    const query = buildQueryString({
      version: options.version,
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
   * @param options Optional reporting window. See {@link LinkMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` or `actionId` is empty.
   */
  getCampaignActionMetricsLinks(
    campaignId: string | number,
    actionId: string | number,
    options: LinkMetricsOptions = {},
  ) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, unique: options.unique });

    return this.request.get(
      `${this.resourceBase('campaigns', campaignId)}/actions/${encodeURIComponent(actionId)}/metrics/links${query}`,
    );
  }

  /**
   * Get delivery metrics for a campaign over time.
   *
   * @param campaignId The campaign's numeric id.
   * @param options Optional reporting window/filters. See {@link CampaignMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `campaignId` is empty.
   */
  getCampaignMetrics(campaignId: string | number, options: CampaignMetricsOptions = {}) {
    if (isEmpty(campaignId)) {
      throw new MissingParamError('campaignId');
    }

    const query = buildQueryString({
      version: options.version,
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

    const query = buildQueryString({ start: options.start, end: options.end, resolution: options.res });

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
   * Get metrics for a single broadcast action over time. Aggregated across all
   * channels (the API does not accept a `type` filter here).
   *
   * @param broadcastId The broadcast's numeric id.
   * @param actionId The action's numeric id.
   * @param options Optional reporting window. See {@link MetricsWindowOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` or `actionId` is empty.
   */
  getBroadcastActionMetrics(
    broadcastId: string | number,
    actionId: string | number,
    options: MetricsWindowOptions = {},
  ) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps });

    return this.request.get(
      `${this.resourceBase('broadcasts', broadcastId)}/actions/${encodeURIComponent(actionId)}/metrics${query}`,
    );
  }

  /**
   * Get link (click) metrics for a single broadcast action over time.
   *
   * @param broadcastId The broadcast's numeric id.
   * @param actionId The action's numeric id.
   * @param options Optional reporting window. See {@link LinkMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `broadcastId` or `actionId` is empty.
   */
  getBroadcastActionMetricsLinks(
    broadcastId: string | number,
    actionId: string | number,
    options: LinkMetricsOptions = {},
  ) {
    if (isEmpty(broadcastId)) {
      throw new MissingParamError('broadcastId');
    }

    if (isEmpty(actionId)) {
      throw new MissingParamError('actionId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, unique: options.unique });

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

  /**
   * List the newsletters in your workspace.
   *
   * @param options Optional pagination and sort. See {@link ListNewslettersOptions}.
   * @returns The parsed JSON response body (`{ newsletters: [...], next }`).
   */
  listNewsletters(options: ListNewslettersOptions = {}) {
    const query = buildQueryString({ start: options.start, limit: options.limit, sort: options.sort });

    return this.request.get(`${this.apiRoot}/newsletters${query}`);
  }

  /**
   * Create a newsletter.
   *
   * @param data The newsletter definition.
   * @returns The parsed JSON response body.
   */
  createNewsletter(data: RequestData = {}) {
    return this.request.post(`${this.apiRoot}/newsletters`, data);
  }

  /**
   * Get a single newsletter's metadata.
   *
   * @param newsletterId The newsletter's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  getNewsletter(newsletterId: string | number) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.get(this.resourceBase('newsletters', newsletterId));
  }

  /**
   * Delete a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  deleteNewsletter(newsletterId: string | number) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.destroy(this.resourceBase('newsletters', newsletterId));
  }

  /**
   * List all content variants of a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  getNewsletterContents(newsletterId: string | number) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.get(`${this.resourceBase('newsletters', newsletterId)}/contents`);
  }

  /**
   * Get a single content variant of a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param contentId The content variant's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` or `contentId` is empty.
   */
  getNewsletterContent(newsletterId: string | number, contentId: string | number) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(contentId)) {
      throw new MissingParamError('contentId');
    }

    return this.request.get(
      `${this.resourceBase('newsletters', newsletterId)}/contents/${encodeURIComponent(contentId)}`,
    );
  }

  /**
   * Update a content variant of a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param contentId The content variant's numeric id.
   * @param data The content fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` or `contentId` is empty.
   */
  updateNewsletterContent(newsletterId: string | number, contentId: string | number, data: RequestData = {}) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(contentId)) {
      throw new MissingParamError('contentId');
    }

    return this.request.put(
      `${this.resourceBase('newsletters', newsletterId)}/contents/${encodeURIComponent(contentId)}`,
      data,
    );
  }

  /**
   * Get metrics for a single newsletter content variant over time.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param contentId The content variant's numeric id.
   * @param options Optional reporting window/filters. See {@link NewsletterMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` or `contentId` is empty.
   */
  getNewsletterContentMetrics(
    newsletterId: string | number,
    contentId: string | number,
    options: NewsletterMetricsOptions = {},
  ) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(contentId)) {
      throw new MissingParamError('contentId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps });

    return this.request.get(
      `${this.resourceBase('newsletters', newsletterId)}/contents/${encodeURIComponent(contentId)}/metrics${query}`,
    );
  }

  /**
   * Get link (click) metrics for a single newsletter content variant over time.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param contentId The content variant's numeric id.
   * @param options Optional reporting window. See {@link LinkMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` or `contentId` is empty.
   */
  getNewsletterContentMetricsLinks(
    newsletterId: string | number,
    contentId: string | number,
    options: LinkMetricsOptions = {},
  ) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(contentId)) {
      throw new MissingParamError('contentId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, unique: options.unique });

    return this.request.get(
      `${this.resourceBase('newsletters', newsletterId)}/contents/${encodeURIComponent(contentId)}/metrics/links${query}`,
    );
  }

  /**
   * Get delivery metrics for a newsletter over time.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param options Optional reporting window/filters. See {@link NewsletterMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  getNewsletterMetrics(newsletterId: string | number, options: NewsletterMetricsOptions = {}) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps });

    return this.request.get(`${this.resourceBase('newsletters', newsletterId)}/metrics${query}`);
  }

  /**
   * Get link (click) metrics for a newsletter over time.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param options Optional reporting window. See {@link LinkMetricsOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  getNewsletterMetricsLinks(newsletterId: string | number, options: LinkMetricsOptions = {}) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    const query = buildQueryString({ period: options.period, steps: options.steps, unique: options.unique });

    return this.request.get(`${this.resourceBase('newsletters', newsletterId)}/metrics/links${query}`);
  }

  /**
   * Get the individual messages (deliveries) sent by a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param options Optional filters/pagination. See {@link NewsletterMessagesOptions}.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  getNewsletterMessages(newsletterId: string | number, options: NewsletterMessagesOptions = {}) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    const query = buildQueryString({
      start: options.start,
      limit: options.limit,
      metric: options.metric,
      type: options.type,
      start_ts: options.start_ts,
      end_ts: options.end_ts,
      get_tracked_responses: options.get_tracked_responses,
    });

    return this.request.get(`${this.resourceBase('newsletters', newsletterId)}/messages${query}`);
  }

  /**
   * Send a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param data Optional send settings — e.g. `rate_limit_email_rate`,
   *   `rate_limit_time_period`, `rate_limit_spread`.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  sendNewsletter(newsletterId: string | number, data: RequestData = {}) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.post(`${this.resourceBase('newsletters', newsletterId)}/send`, data);
  }

  /**
   * Schedule a newsletter to send later.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param data The schedule settings.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  scheduleNewsletter(newsletterId: string | number, data: RequestData = {}) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.post(`${this.resourceBase('newsletters', newsletterId)}/schedule`, data);
  }

  /**
   * Add a language (translation) to a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param data The translation content, including its `language` tag.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  createNewsletterLanguage(newsletterId: string | number, data: RequestData = {}) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.post(`${this.resourceBase('newsletters', newsletterId)}/language`, data);
  }

  /**
   * Get a single-language translation of a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param language The IETF language tag.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` or `language` is empty.
   */
  getNewsletterLanguage(newsletterId: string | number, language: string) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.get(
      `${this.resourceBase('newsletters', newsletterId)}/language/${encodeURIComponent(language)}`,
    );
  }

  /**
   * Update a single-language translation of a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param language The IETF language tag.
   * @param data The translation fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` or `language` is empty.
   */
  updateNewsletterLanguage(newsletterId: string | number, language: string, data: RequestData = {}) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.put(
      `${this.resourceBase('newsletters', newsletterId)}/language/${encodeURIComponent(language)}`,
      data,
    );
  }

  /**
   * Delete a single-language translation of a newsletter.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param language The IETF language tag.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` or `language` is empty.
   */
  deleteNewsletterLanguage(newsletterId: string | number, language: string) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.destroy(
      `${this.resourceBase('newsletters', newsletterId)}/language/${encodeURIComponent(language)}`,
    );
  }

  /**
   * List a newsletter's A/B test groups.
   *
   * @param newsletterId The newsletter's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  getNewsletterTestGroups(newsletterId: string | number) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.get(`${this.resourceBase('newsletters', newsletterId)}/test_groups`);
  }

  /**
   * Create an A/B test group on a newsletter. The API takes no request body —
   * a new empty test group is created and returned.
   *
   * @param newsletterId The newsletter's numeric id.
   * @returns The parsed JSON response body (the updated newsletter).
   * @throws {MissingParamError} If `newsletterId` is empty.
   */
  createNewsletterTestGroup(newsletterId: string | number) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.post(`${this.resourceBase('newsletters', newsletterId)}/test_groups`);
  }

  /**
   * Add a language (translation) to a newsletter test group.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param testGroupId The test group's id.
   * @param data The translation content, including its `language` tag.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId` or `testGroupId` is empty.
   */
  createNewsletterTestGroupLanguage(
    newsletterId: string | number,
    testGroupId: string | number,
    data: RequestData = {},
  ) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(testGroupId)) {
      throw new MissingParamError('testGroupId');
    }

    return this.request.post(
      `${this.resourceBase('newsletters', newsletterId)}/test_group/${encodeURIComponent(testGroupId)}/language`,
      data,
    );
  }

  /**
   * Get a single-language translation of a newsletter test group.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param testGroupId The test group's id.
   * @param language The IETF language tag.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId`, `testGroupId`, or `language` is empty.
   */
  getNewsletterTestGroupLanguage(newsletterId: string | number, testGroupId: string | number, language: string) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(testGroupId)) {
      throw new MissingParamError('testGroupId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.get(
      `${this.resourceBase('newsletters', newsletterId)}/test_group/${encodeURIComponent(testGroupId)}/language/${encodeURIComponent(language)}`,
    );
  }

  /**
   * Update a single-language translation of a newsletter test group.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param testGroupId The test group's id.
   * @param language The IETF language tag.
   * @param data The translation fields to update.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId`, `testGroupId`, or `language` is empty.
   */
  updateNewsletterTestGroupLanguage(
    newsletterId: string | number,
    testGroupId: string | number,
    language: string,
    data: RequestData = {},
  ) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(testGroupId)) {
      throw new MissingParamError('testGroupId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.put(
      `${this.resourceBase('newsletters', newsletterId)}/test_group/${encodeURIComponent(testGroupId)}/language/${encodeURIComponent(language)}`,
      data,
    );
  }

  /**
   * Delete a single-language translation of a newsletter test group.
   *
   * @param newsletterId The newsletter's numeric id.
   * @param testGroupId The test group's id.
   * @param language The IETF language tag.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `newsletterId`, `testGroupId`, or `language` is empty.
   */
  deleteNewsletterTestGroupLanguage(newsletterId: string | number, testGroupId: string | number, language: string) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    if (isEmpty(testGroupId)) {
      throw new MissingParamError('testGroupId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.destroy(
      `${this.resourceBase('newsletters', newsletterId)}/test_group/${encodeURIComponent(testGroupId)}/language/${encodeURIComponent(language)}`,
    );
  }

  /**
   * List Design Studio folders.
   *
   * @param options Optional filters, sorting, and pagination. See {@link DesignStudioListOptions}.
   * @returns The parsed JSON response body (`{ folders: [...], meta }`).
   */
  listDesignStudioFolders(options: DesignStudioListOptions = {}) {
    const query = buildQueryString({
      parent_folder_id: options.parentFolderId,
      direct_descendants_only: options.directDescendantsOnly,
      sort_by: options.sortBy,
      sort_order: options.sortOrder,
      created_before: options.createdBefore,
      created_after: options.createdAfter,
      updated_before: options.updatedBefore,
      updated_after: options.updatedAfter,
      page: options.page,
      limit: options.limit,
    });

    return this.request.get(`${this.apiRoot}/design_studio/folders${query}`);
  }

  /**
   * Create a Design Studio folder.
   *
   * @param folder The folder definition. `name` is required. See {@link DesignStudioFolderInput}.
   * @returns The parsed JSON response body (`{ folder: {...} }`).
   * @throws {MissingParamError} If `folder` is missing/not an object, or `folder.name` is empty.
   */
  createDesignStudioFolder(folder: DesignStudioFolderInput) {
    if (folder == null || typeof folder !== 'object') {
      throw new MissingParamError('folder');
    }

    if (isEmpty(folder.name)) {
      throw new MissingParamError('folder.name');
    }

    return this.request.post(`${this.apiRoot}/design_studio/folders`, folder);
  }

  /**
   * Get a single Design Studio folder.
   *
   * @param folderId The folder's UUID.
   * @returns The parsed JSON response body (`{ folder: {...} }`).
   * @throws {MissingParamError} If `folderId` is empty.
   */
  getDesignStudioFolder(folderId: string) {
    if (isEmpty(folderId)) {
      throw new MissingParamError('folderId');
    }

    return this.request.get(`${this.apiRoot}/design_studio/folders/${encodeURIComponent(folderId)}`);
  }

  /**
   * Update a Design Studio folder. At least one field must be provided.
   *
   * @param folderId The folder's UUID.
   * @param updates The fields to change. See {@link DesignStudioFolderUpdate}.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `folderId` is empty or `updates` is missing/not an object.
   */
  updateDesignStudioFolder(folderId: string, updates: DesignStudioFolderUpdate) {
    if (isEmpty(folderId)) {
      throw new MissingParamError('folderId');
    }

    if (updates == null || typeof updates !== 'object') {
      throw new MissingParamError('updates');
    }

    return this.request.put(`${this.apiRoot}/design_studio/folders/${encodeURIComponent(folderId)}`, updates);
  }

  /**
   * Delete a Design Studio folder.
   *
   * @param folderId The folder's UUID.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `folderId` is empty.
   */
  deleteDesignStudioFolder(folderId: string) {
    if (isEmpty(folderId)) {
      throw new MissingParamError('folderId');
    }

    return this.request.destroy(`${this.apiRoot}/design_studio/folders/${encodeURIComponent(folderId)}`);
  }

  /**
   * List Design Studio emails.
   *
   * @param options Optional filters, sorting, and pagination. See {@link ListDesignStudioEmailsOptions}.
   * @returns The parsed JSON response body (`{ emails: [...], folders: [...], meta }`).
   */
  listDesignStudioEmails(options: ListDesignStudioEmailsOptions = {}) {
    const query = buildQueryString({
      parent_folder_id: options.parentFolderId,
      direct_descendants_only: options.directDescendantsOnly,
      sort_by: options.sortBy,
      sort_order: options.sortOrder,
      created_before: options.createdBefore,
      created_after: options.createdAfter,
      updated_before: options.updatedBefore,
      updated_after: options.updatedAfter,
      page: options.page,
      limit: options.limit,
      is_template: options.isTemplate,
      has_translations: options.hasTranslations,
      is_linked: options.isLinked,
    });

    return this.request.get(`${this.apiRoot}/design_studio/emails${query}`);
  }

  /**
   * Create a Design Studio email.
   *
   * @param email The email definition. `name` is required. See {@link DesignStudioEmailInput}.
   * @returns The parsed JSON response body (`{ email: {...} }`).
   * @throws {MissingParamError} If `email` is missing/not an object, or `email.name` is empty.
   */
  createDesignStudioEmail(email: DesignStudioEmailInput) {
    if (email == null || typeof email !== 'object') {
      throw new MissingParamError('email');
    }

    if (isEmpty(email.name)) {
      throw new MissingParamError('email.name');
    }

    return this.request.post(`${this.apiRoot}/design_studio/emails`, email);
  }

  /**
   * Get a single Design Studio email.
   *
   * @param emailId The email's UUID.
   * @returns The parsed JSON response body (`{ email: {...} }`).
   * @throws {MissingParamError} If `emailId` is empty.
   */
  getDesignStudioEmail(emailId: string) {
    if (isEmpty(emailId)) {
      throw new MissingParamError('emailId');
    }

    return this.request.get(`${this.apiRoot}/design_studio/emails/${encodeURIComponent(emailId)}`);
  }

  /**
   * Update a Design Studio email. At least one field must be provided.
   *
   * @param emailId The email's UUID.
   * @param updates The fields to change. See {@link DesignStudioEmailUpdate}.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `emailId` is empty or `updates` is missing/not an object.
   */
  updateDesignStudioEmail(emailId: string, updates: DesignStudioEmailUpdate) {
    if (isEmpty(emailId)) {
      throw new MissingParamError('emailId');
    }

    if (updates == null || typeof updates !== 'object') {
      throw new MissingParamError('updates');
    }

    return this.request.put(`${this.apiRoot}/design_studio/emails/${encodeURIComponent(emailId)}`, updates);
  }

  /**
   * Delete a Design Studio email.
   *
   * @param emailId The email's UUID.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `emailId` is empty.
   */
  deleteDesignStudioEmail(emailId: string) {
    if (isEmpty(emailId)) {
      throw new MissingParamError('emailId');
    }

    return this.request.destroy(`${this.apiRoot}/design_studio/emails/${encodeURIComponent(emailId)}`);
  }

  /**
   * List the translations (languages) of a Design Studio email.
   *
   * @param emailId The email's UUID.
   * @returns The parsed JSON response body (`{ email_translations: [...] }`).
   * @throws {MissingParamError} If `emailId` is empty.
   */
  listDesignStudioEmailLanguages(emailId: string) {
    if (isEmpty(emailId)) {
      throw new MissingParamError('emailId');
    }

    return this.request.get(`${this.apiRoot}/design_studio/emails/${encodeURIComponent(emailId)}/languages`);
  }

  /**
   * Create a translation of a Design Studio email. Content blocks you omit are
   * inherited from the default-language email.
   *
   * @param emailId The email's UUID.
   * @param translation The translation definition. `language` is required. See {@link DesignStudioEmailTranslationInput}.
   * @returns The parsed JSON response body (`{ email_translation: {...} }`).
   * @throws {MissingParamError} If `emailId` is empty, `translation` is missing/not an object, or `translation.language` is empty.
   */
  createDesignStudioEmailLanguage(emailId: string, translation: DesignStudioEmailTranslationInput) {
    if (isEmpty(emailId)) {
      throw new MissingParamError('emailId');
    }

    if (translation == null || typeof translation !== 'object') {
      throw new MissingParamError('translation');
    }

    if (isEmpty(translation.language)) {
      throw new MissingParamError('translation.language');
    }

    return this.request.post(
      `${this.apiRoot}/design_studio/emails/${encodeURIComponent(emailId)}/languages`,
      translation,
    );
  }

  /**
   * Get a single-language translation of a Design Studio email.
   *
   * @param emailId The email's UUID.
   * @param language The IETF language tag.
   * @returns The parsed JSON response body (`{ email_translation: {...} }`).
   * @throws {MissingParamError} If `emailId` or `language` is empty.
   */
  getDesignStudioEmailLanguage(emailId: string, language: string) {
    if (isEmpty(emailId)) {
      throw new MissingParamError('emailId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.get(
      `${this.apiRoot}/design_studio/emails/${encodeURIComponent(emailId)}/languages/${encodeURIComponent(language)}`,
    );
  }

  /**
   * Update a single-language translation of a Design Studio email. At least one field must be provided.
   *
   * @param emailId The email's UUID.
   * @param language The IETF language tag.
   * @param updates The fields to change. See {@link DesignStudioEmailTranslationUpdate}.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `emailId` or `language` is empty, or `updates` is missing/not an object.
   */
  updateDesignStudioEmailLanguage(emailId: string, language: string, updates: DesignStudioEmailTranslationUpdate) {
    if (isEmpty(emailId)) {
      throw new MissingParamError('emailId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    if (updates == null || typeof updates !== 'object') {
      throw new MissingParamError('updates');
    }

    return this.request.put(
      `${this.apiRoot}/design_studio/emails/${encodeURIComponent(emailId)}/languages/${encodeURIComponent(language)}`,
      updates,
    );
  }

  /**
   * Delete a single-language translation of a Design Studio email.
   *
   * @param emailId The email's UUID.
   * @param language The IETF language tag.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `emailId` or `language` is empty.
   */
  deleteDesignStudioEmailLanguage(emailId: string, language: string) {
    if (isEmpty(emailId)) {
      throw new MissingParamError('emailId');
    }

    if (isEmpty(language)) {
      throw new MissingParamError('language');
    }

    return this.request.destroy(
      `${this.apiRoot}/design_studio/emails/${encodeURIComponent(emailId)}/languages/${encodeURIComponent(language)}`,
    );
  }

  /**
   * List Design Studio components.
   *
   * @param options Optional filters, sorting, and pagination. See {@link ListDesignStudioComponentsOptions}.
   * @returns The parsed JSON response body (`{ components: [...], folders: [...], meta }`).
   */
  listDesignStudioComponents(options: ListDesignStudioComponentsOptions = {}) {
    const query = buildQueryString({
      parent_folder_id: options.parentFolderId,
      direct_descendants_only: options.directDescendantsOnly,
      sort_by: options.sortBy,
      sort_order: options.sortOrder,
      created_before: options.createdBefore,
      created_after: options.createdAfter,
      updated_before: options.updatedBefore,
      updated_after: options.updatedAfter,
      page: options.page,
      limit: options.limit,
      tag: options.tag,
    });

    return this.request.get(`${this.apiRoot}/design_studio/components${query}`);
  }

  /**
   * Create a Design Studio component.
   *
   * @param component The component definition. `name` and `tag` are required. See {@link DesignStudioComponentInput}.
   * @returns The parsed JSON response body (`{ component: {...} }`).
   * @throws {MissingParamError} If `component` is missing/not an object, or `component.name`/`component.tag` is empty.
   */
  createDesignStudioComponent(component: DesignStudioComponentInput) {
    if (component == null || typeof component !== 'object') {
      throw new MissingParamError('component');
    }

    if (isEmpty(component.name)) {
      throw new MissingParamError('component.name');
    }

    if (isEmpty(component.tag)) {
      throw new MissingParamError('component.tag');
    }

    return this.request.post(`${this.apiRoot}/design_studio/components`, component);
  }

  /**
   * Get a single Design Studio component.
   *
   * @param componentId The component's UUID.
   * @returns The parsed JSON response body (`{ component: {...} }`).
   * @throws {MissingParamError} If `componentId` is empty.
   */
  getDesignStudioComponent(componentId: string) {
    if (isEmpty(componentId)) {
      throw new MissingParamError('componentId');
    }

    return this.request.get(`${this.apiRoot}/design_studio/components/${encodeURIComponent(componentId)}`);
  }

  /**
   * Update a Design Studio component. At least one field must be provided.
   *
   * @param componentId The component's UUID.
   * @param updates The fields to change. See {@link DesignStudioComponentUpdate}.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `componentId` is empty or `updates` is missing/not an object.
   */
  updateDesignStudioComponent(componentId: string, updates: DesignStudioComponentUpdate) {
    if (isEmpty(componentId)) {
      throw new MissingParamError('componentId');
    }

    if (updates == null || typeof updates !== 'object') {
      throw new MissingParamError('updates');
    }

    return this.request.put(`${this.apiRoot}/design_studio/components/${encodeURIComponent(componentId)}`, updates);
  }

  /**
   * Delete a Design Studio component.
   *
   * @param componentId The component's UUID.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `componentId` is empty.
   */
  deleteDesignStudioComponent(componentId: string) {
    if (isEmpty(componentId)) {
      throw new MissingParamError('componentId');
    }

    return this.request.destroy(`${this.apiRoot}/design_studio/components/${encodeURIComponent(componentId)}`);
  }

  /**
   * List uploaded assets (files).
   *
   * @param options Optional folder filter and pagination. See {@link AssetListOptions}.
   * @returns The parsed JSON response body (`{ assets: [...], meta }`).
   */
  listAssets(options: AssetListOptions = {}) {
    const query = buildQueryString({
      parent_folder_id: options.parentFolderId,
      direct_descendants_only: options.directDescendantsOnly,
      page: options.page,
      limit: options.limit,
    });

    return this.request.get(`${this.apiRoot}/assets${query}`);
  }

  /**
   * Upload a file asset (`multipart/form-data`).
   *
   * @param file The file to upload. `data` and `filename` are required. See {@link CreateAssetInput}.
   * @returns The parsed JSON response body (`{ asset: {...} }`).
   * @throws {MissingParamError} If `file` is missing/not an object, or `file.data`/`file.filename` is missing.
   */
  createAsset(file: CreateAssetInput) {
    if (file == null || typeof file !== 'object') {
      throw new MissingParamError('file');
    }

    if (file.data == null) {
      throw new MissingParamError('file.data');
    }

    if (isEmpty(file.filename)) {
      throw new MissingParamError('file.filename');
    }

    const form = new FormData();
    const blob = file.contentType ? new Blob([file.data], { type: file.contentType }) : new Blob([file.data]);
    form.append('file', blob, file.filename);

    if (file.name !== undefined) {
      form.append('name', file.name);
    }

    if (file.parentFolderId !== undefined) {
      form.append('parent_folder_id', String(file.parentFolderId));
    }

    return this.request.postForm(`${this.apiRoot}/assets/files`, form);
  }

  /**
   * Get a single asset (file).
   *
   * @param assetId The asset's numeric id.
   * @returns The parsed JSON response body (`{ asset: {...} }`).
   * @throws {MissingParamError} If `assetId` is empty.
   */
  getAsset(assetId: string | number) {
    if (isEmpty(assetId)) {
      throw new MissingParamError('assetId');
    }

    return this.request.get(`${this.apiRoot}/assets/files/${encodeURIComponent(assetId)}`);
  }

  /**
   * Update an asset's name and/or parent folder. At least one field must be provided;
   * the file bytes cannot be changed.
   *
   * @param assetId The asset's numeric id.
   * @param updates The fields to change. See {@link AssetUpdate}.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `assetId` is empty or `updates` is missing/not an object.
   */
  updateAsset(assetId: string | number, updates: AssetUpdate) {
    if (isEmpty(assetId)) {
      throw new MissingParamError('assetId');
    }

    if (updates == null || typeof updates !== 'object') {
      throw new MissingParamError('updates');
    }

    return this.request.put(`${this.apiRoot}/assets/files/${encodeURIComponent(assetId)}`, updates);
  }

  /**
   * Delete an asset (file).
   *
   * @param assetId The asset's numeric id.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `assetId` is empty.
   */
  deleteAsset(assetId: string | number) {
    if (isEmpty(assetId)) {
      throw new MissingParamError('assetId');
    }

    return this.request.destroy(`${this.apiRoot}/assets/files/${encodeURIComponent(assetId)}`);
  }

  /**
   * List asset folders.
   *
   * @param options Optional folder filter and pagination. See {@link AssetListOptions}.
   * @returns The parsed JSON response body (`{ folders: [...], meta }`).
   */
  listAssetFolders(options: AssetListOptions = {}) {
    const query = buildQueryString({
      parent_folder_id: options.parentFolderId,
      direct_descendants_only: options.directDescendantsOnly,
      page: options.page,
      limit: options.limit,
    });

    return this.request.get(`${this.apiRoot}/assets/folders${query}`);
  }

  /**
   * Create an asset folder.
   *
   * @param folder The folder definition. `name` is required. See {@link AssetFolderInput}.
   * @returns The parsed JSON response body (`{ folder: {...} }`).
   * @throws {MissingParamError} If `folder` is missing/not an object, or `folder.name` is empty.
   */
  createAssetFolder(folder: AssetFolderInput) {
    if (folder == null || typeof folder !== 'object') {
      throw new MissingParamError('folder');
    }

    if (isEmpty(folder.name)) {
      throw new MissingParamError('folder.name');
    }

    return this.request.post(`${this.apiRoot}/assets/folders`, folder);
  }

  /**
   * Get a single asset folder.
   *
   * @param folderId The folder's numeric id.
   * @returns The parsed JSON response body (`{ folder: {...} }`).
   * @throws {MissingParamError} If `folderId` is empty.
   */
  getAssetFolder(folderId: string | number) {
    if (isEmpty(folderId)) {
      throw new MissingParamError('folderId');
    }

    return this.request.get(`${this.apiRoot}/assets/folders/${encodeURIComponent(folderId)}`);
  }

  /**
   * Update an asset folder. At least one field must be provided.
   *
   * @param folderId The folder's numeric id.
   * @param updates The fields to change. See {@link AssetFolderUpdate}.
   * @returns The parsed JSON response body (empty on success — the API returns 204).
   * @throws {MissingParamError} If `folderId` is empty or `updates` is missing/not an object.
   */
  updateAssetFolder(folderId: string | number, updates: AssetFolderUpdate) {
    if (isEmpty(folderId)) {
      throw new MissingParamError('folderId');
    }

    if (updates == null || typeof updates !== 'object') {
      throw new MissingParamError('updates');
    }

    return this.request.put(`${this.apiRoot}/assets/folders/${encodeURIComponent(folderId)}`, updates);
  }

  /**
   * Delete an asset folder. The folder must be empty.
   *
   * @param folderId The folder's numeric id.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `folderId` is empty.
   */
  deleteAssetFolder(folderId: string | number) {
    if (isEmpty(folderId)) {
      throw new MissingParamError('folderId');
    }

    return this.request.destroy(`${this.apiRoot}/assets/folders/${encodeURIComponent(folderId)}`);
  }
}

export {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendWhatsAppRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './api/requests';
