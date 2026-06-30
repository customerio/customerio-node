import type {
  BasicAuth,
  RequestData,
  PushRequestData,
  MetricRequestData,
  RequestDefaults,
  RetryOptions,
} from './request';
import Request from './request';
import { Region, RegionUS } from './regions';
import { isEmpty, isIdentifierType, MissingParamError } from './utils';
import type { IdentifierType } from './types';

type TrackDefaults = RequestDefaults & { region: Region; url?: string; retry?: Partial<RetryOptions> };

export type BatchOperation = Record<string, any>;

/**
 * Client for the Customer.io Track API.
 *
 * Authenticates with a site id + API key (basic auth). Use this client to
 * identify people, track events, manage devices, and merge profiles.
 *
 * Every method rejects with a {@link CustomerIORequestError} when the API
 * returns a non-2xx status.
 *
 * @example
 * ```ts
 * import { TrackClient, RegionUS } from 'customerio-node';
 *
 * const cio = new TrackClient(siteId, apiKey, { region: RegionUS });
 * await cio.identify('123', { email: 'a@example.com', plan: 'pro' });
 * await cio.track('123', { name: 'signup' });
 * ```
 */
export class TrackClient {
  siteid: BasicAuth['siteid'];
  apikey: BasicAuth['apikey'];
  defaults: TrackDefaults;
  request: Request;
  trackRoot: string;
  trackV2Root: string;

  /**
   * @param siteid Your Customer.io workspace site id.
   * @param apikey Your Customer.io Track API key.
   * @param defaults Optional overrides. Use `region` to select {@link RegionUS} or {@link RegionEU},
   *   `url` to point at a custom host (e.g. a mock server), `timeout` (ms, default `10000`), or any
   *   other fetch {@link RequestDefaults} field — notably `dispatcher` (an undici `Agent` /
   *   `ProxyAgent`) for proxies, custom TLS, or connection keep-alive.
   * @throws If `region` is provided and is not a {@link Region} instance.
   */
  constructor(siteid: BasicAuth['siteid'], apikey: BasicAuth['apikey'], defaults: Partial<TrackDefaults> = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.siteid = siteid;
    this.apikey = apikey;
    this.defaults = { ...defaults, region: defaults.region || RegionUS };
    // `region`/`url` are SDK concerns (they select the host); strip them so the
    // transport receives only fetch init. `retry` is handled by `Request`.
    const { region: _region, url: _url, ...requestDefaults } = this.defaults;
    this.request = new Request({ siteid: this.siteid, apikey: this.apikey }, requestDefaults);

    this.trackRoot = this.defaults.url ? this.defaults.url : this.defaults.region.trackUrl;
    this.trackV2Root = this.defaults.url
      ? this.defaults.url.replace('/api/v1', '/api/v2')
      : this.defaults.region.trackV2Url;
  }

  /**
   * Create or update a person.
   *
   * To update an existing person's identifier (e.g. change their `id` or `email`),
   * pass the `cio_id` prefixed with `cio_` as `customerId`.
   *
   * @param customerId The person's unique identifier (id, email, or `cio_<cio_id>`).
   * @param data Attributes to set on the person. `email` is required if you intend to
   *   send email messages; `created_at` is required for time-based segmentation.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId` is empty.
   */
  identify(customerId: string | number, data: RequestData = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.put(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}`, data);
  }

  /**
   * Permanently delete a person.
   *
   * This does not suppress the person — they can be re-added later. To prevent
   * re-adding, use {@link TrackClient.suppress} instead.
   *
   * @param customerId The person's unique identifier.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId` is empty.
   */
  destroy(customerId: string | number) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.destroy(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}`);
  }

  /**
   * Suppress a person. Suppressed people are deleted and cannot be re-added by
   * subsequent `identify` calls. Pair with {@link TrackClient.unsuppress} to reverse.
   *
   * @param customerId The person's unique identifier.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId` is empty.
   */
  suppress(customerId: string | number) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/suppress`);
  }

  /**
   * Unsuppress a previously suppressed person.
   *
   * @param customerId The person's unique identifier.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId` is empty.
   */
  unsuppress(customerId: string | number) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/unsuppress`);
  }

  /**
   * Record an event for a known person.
   *
   * @param customerId The person's unique identifier.
   * @param data Event payload. Must include a `name` string. Optionally include `data`
   *   (object of event attributes) and `type` to differentiate event vs. page events.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId` or `data.name` is empty.
   */
  track(customerId: string | number, data: RequestData = {}) {
    if (isEmpty(customerId)) {
      throw new MissingParamError('customerId');
    }

    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    return this.request.post(`${this.trackRoot}/customers/${encodeURIComponent(customerId)}/events`, data);
  }

  /**
   * Record an event for an anonymous (not-yet-identified) person.
   *
   * Anonymous events cannot trigger campaigns directly, but if event merging
   * is enabled and you later `identify` the person with a matching
   * `anonymous_id` attribute, prior anonymous events will be associated
   * with the profile. Events associated within 72 hours can trigger campaigns.
   *
   * Pass an empty string for `anonymousId` to send an anonymous invite event
   * (requires a `recipient` attribute in `data`).
   *
   * @param anonymousId Identifier for the anonymous person, or `''` for an invite event.
   * @param data Event payload. Must include a `name` string.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `data.name` is empty.
   */
  trackAnonymous(anonymousId: string | number, data: RequestData = {}) {
    if (isEmpty(data.name)) {
      throw new MissingParamError('data.name');
    }

    let payload = { ...data };

    if (!isEmpty(anonymousId)) {
      payload['anonymous_id'] = anonymousId;
    }

    return this.request.post(`${this.trackRoot}/events`, payload);
  }

  /**
   * Record a page view event for a known person.
   *
   * @param customerId The person's unique identifier.
   * @param path The page URL or path being viewed.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId` or `path` is empty.
   */
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

  /**
   * Report a push notification lifecycle event (delivered, opened, converted).
   *
   * Used by integrations that want to feed delivery telemetry back to Customer.io
   * for analytics and campaign optimization.
   *
   * @param data Push event payload (delivery_id, device_id, event, timestamp).
   * @returns The parsed JSON response body.
   */
  trackPush(data: PushRequestData = {}) {
    return this.request.post(`${this.trackRoot}/push/events`, data);
  }

  /**
   * Register a device for push delivery to a person.
   *
   * @param customerId The person's unique identifier.
   * @param device_id The platform-issued device/push token (e.g. APNs token, FCM token).
   * @param platform Device platform — typically `"ios"` or `"android"`.
   * @param data Optional device metadata. `last_used` (unix timestamp) is treated specially;
   *   any other keys are stored as device attributes.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId`, `device_id`, or `platform` is empty.
   */
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
      device: {
        id: device_id,
        platform,
        ...(last_used != null ? { last_used } : {}),
        ...(Object.keys(attributes).length && { attributes }),
      },
    });
  }

  /**
   * Remove a device from a person.
   *
   * @param customerId The person's unique identifier.
   * @param deviceToken The device/push token to remove.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `customerId` or `deviceToken` is empty.
   */
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

  /**
   * Send a batch of Track API operations in a single request to the v2 batch endpoint.
   *
   * Each operation is a self-describing object (e.g. an identify, track, or
   * delete payload). Use this to reduce request overhead for high-volume work.
   *
   * @param operations A non-empty array of batch operation objects.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `operations` is not a non-empty array.
   */
  batch(operations: BatchOperation[]) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new MissingParamError('operations');
    }

    return this.request.post(`${this.trackV2Root}/batch`, { batch: operations });
  }

  /**
   * Merge two people. The secondary profile is permanently deleted and its
   * attributes/events are merged into the primary.
   *
   * The identifier types are independent: you can merge by `email` into a
   * profile identified by `id`, and so on.
   *
   * @param primaryIdType Type of identifier for the surviving profile.
   * @param primaryId Identifier value for the surviving profile.
   * @param secondaryIdType Type of identifier for the profile to be merged in.
   * @param secondaryId Identifier value for the profile to be merged in.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If either `primaryId` or `secondaryId` is empty.
   * @throws {Error} If either identifier type is not one of {@link IdentifierType}.
   */
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

    if (!isIdentifierType(primaryIdType) || !isIdentifierType(secondaryIdType)) {
      throw new Error('primaryIdType and secondaryIdType must be one of "id", "cio_id", or "email"');
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

  /**
   * Look up the data region your account belongs to.
   *
   * Confirms whether your workspace is hosted in the US or EU region and
   * returns the base URL your other Track API calls should use.
   *
   * @returns The parsed JSON response body (`{ url, region, environment_id }`).
   */
  getAccountRegion() {
    return this.request.get(`${this.trackRoot}/accounts/region`);
  }

  /**
   * Send a single self-describing Track operation to the v2 entity endpoint.
   *
   * This is the singular counterpart to {@link TrackClient.batch}: `operation`
   * is the same shape as one element of a `batch` array — an identify, track,
   * delete, merge, add/remove relationship, add/remove device, etc.
   *
   * @param operation A single batch-style operation object.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `operation` is not a non-empty object.
   */
  entity(operation: BatchOperation) {
    if (operation == null || typeof operation !== 'object' || Array.isArray(operation)) {
      throw new MissingParamError('operation');
    }

    if (Object.keys(operation).length === 0) {
      throw new MissingParamError('operation');
    }

    return this.request.post(`${this.trackV2Root}/entity`, operation);
  }

  /**
   * Add people to a manual segment.
   *
   * @param segmentId The manual segment's id.
   * @param customerIds The identifiers of the people to add (1–1000). The value
   *   type must match `idType`; entries that don't match are ignored by the API.
   * @param idType Which identifier kind the values in `customerIds` are. When
   *   omitted, the API uses its default (`id`).
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `segmentId` is empty or `customerIds` is not a non-empty array.
   * @throws {Error} If `idType` is provided and is not a valid {@link IdentifierType}.
   */
  addCustomersToSegment(segmentId: string | number, customerIds: Array<string | number>, idType?: IdentifierType) {
    if (isEmpty(segmentId)) {
      throw new MissingParamError('segmentId');
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      throw new MissingParamError('customerIds');
    }

    if (idType != null && !isIdentifierType(idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    const query = idType ? `?id_type=${idType}` : '';

    return this.request.post(
      `${this.trackRoot}/segments/${encodeURIComponent(segmentId)}/add_customers${query}`,
      { ids: customerIds },
    );
  }

  /**
   * Remove people from a manual segment.
   *
   * @param segmentId The manual segment's id.
   * @param customerIds The identifiers of the people to remove (1–1000). The value
   *   type must match `idType`; entries that don't match are ignored by the API.
   * @param idType Which identifier kind the values in `customerIds` are. When
   *   omitted, the API uses its default (`id`).
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `segmentId` is empty or `customerIds` is not a non-empty array.
   * @throws {Error} If `idType` is provided and is not a valid {@link IdentifierType}.
   */
  removeCustomersFromSegment(segmentId: string | number, customerIds: Array<string | number>, idType?: IdentifierType) {
    if (isEmpty(segmentId)) {
      throw new MissingParamError('segmentId');
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      throw new MissingParamError('customerIds');
    }

    if (idType != null && !isIdentifierType(idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    const query = idType ? `?id_type=${idType}` : '';

    return this.request.post(
      `${this.trackRoot}/segments/${encodeURIComponent(segmentId)}/remove_customers${query}`,
      { ids: customerIds },
    );
  }

  /**
   * Submit a form on behalf of a person.
   *
   * The `data` object holds the submitted form fields. It must contain exactly
   * one identifier (`email` or `id`, depending on your workspace settings) so
   * the submission can be attributed to a person; the person is created if they
   * don't already exist.
   *
   * @param formId The form's id.
   * @param data The submitted form fields, including the identifier.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `formId` is empty or `data` is not a non-empty object.
   */
  submitForm(formId: string | number, data: RequestData = {}) {
    if (isEmpty(formId)) {
      throw new MissingParamError('formId');
    }

    if (data == null || typeof data !== 'object' || Object.keys(data).length === 0) {
      throw new MissingParamError('data');
    }

    return this.request.post(`${this.trackRoot}/forms/${encodeURIComponent(formId)}/submit`, { data });
  }

  /**
   * Report a delivery metric (open, click, bounce, etc.) back to Customer.io.
   *
   * Unlike {@link TrackClient.trackPush} (which targets push deliveries only via
   * `/push/events`), this reports metrics for any channel — email, SMS, push,
   * in-app, Slack, or webhook — to the `/metrics` endpoint. The valid `metric`
   * values depend on the delivery's channel.
   *
   * @param data Metric payload. `delivery_id` is required; optionally include
   *   `metric`, `timestamp`, `recipient`, `reason`, and `href`.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `data.delivery_id` is empty.
   */
  reportMetric(data: MetricRequestData = {}) {
    if (isEmpty(data.delivery_id)) {
      throw new MissingParamError('data.delivery_id');
    }

    return this.request.post(`${this.trackRoot}/metrics`, data);
  }

  /**
   * Custom unsubscribe handling for a specific delivery.
   *
   * Sets (or clears) the recipient's `unsubscribed` attribute and attributes the
   * change to the given delivery. This endpoint lives at the host root (not under
   * `/api/v1`) and does not require authentication — the `deliveryId` itself is
   * the secret.
   *
   * @param deliveryId The `CIO-Delivery-ID` of the message to unsubscribe from.
   * @param unsubscribe When `true` (default) the person is unsubscribed; `false` resubscribes them.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `deliveryId` is empty.
   */
  unsubscribe(deliveryId: string | number, unsubscribe: boolean = true) {
    if (isEmpty(deliveryId)) {
      throw new MissingParamError('deliveryId');
    }

    const host = this.trackRoot.replace('/api/v1', '');

    return this.request.post(`${host}/unsubscribe/${encodeURIComponent(deliveryId)}`, { unsubscribe });
  }
}
