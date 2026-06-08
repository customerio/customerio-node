import type { BasicAuth, RequestData, PushRequestData, RequestDefaults, RetryOptions } from './request';
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
   *   `url` to point at a custom host (e.g. a mock server), or any `https.RequestOptions` field
   *   such as `timeout` (default `10000`).
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
        ...(last_used ? { last_used } : {}),
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
}
