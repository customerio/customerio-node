import { randomUUID } from 'crypto';
import Request from './request';
import type { RequestDefaults, RetryOptions } from './request';
import { Region, RegionUS } from './regions';
import { isEmpty, MissingParamError } from './utils';
import { version } from './version';
import type {
  AliasPayload,
  BatchItem,
  GroupPayload,
  IdentifyPayload,
  PagePayload,
  PipelinesCommon,
  PipelinesContext,
  ScreenPayload,
  TrackPayload,
} from './pipelines/payloads';

export type PipelinesDefaults = RequestDefaults & {
  region: Region;
  /** Overrides the region-derived host. Useful for testing against a proxy. */
  url?: string;
  /**
   * When `true`, sends `X-Strict-Mode: 1` on every request. Strict mode asks
   * the Pipelines API to validate payloads and return proper HTTP error codes
   * instead of accepting and silently dropping malformed events.
   */
  strictMode?: boolean;
  /**
   * Default `context` values merged under every outgoing payload. Per-call
   * `context` always wins on key conflicts. Useful for setting things like
   * `ip` or `locale` once per client instance.
   */
  defaultContext?: PipelinesContext;
  /**
   * Per-request retry policy. Merged over the SDK defaults (3 retries with
   * exponential backoff). Pass `{ maxRetries: 0 }` to opt out entirely.
   */
  retry?: Partial<RetryOptions>;
};

/**
 * Client for the Customer.io Pipelines (Data Pipelines) API.
 *
 * Authenticates with a Data Pipelines source write key. Use this client to send
 * Segment-compatible identify/track/page/screen/group/alias events, one at a
 * time or batched. Payloads use camelCase (`userId`, `anonymousId`, `groupId`,
 * `previousId`), matching the Pipelines wire format.
 *
 * `messageId`, `timestamp`, and `context.library` are auto-filled on every call
 * when you don't supply them; per-call values always win.
 *
 * Every method rejects with a {@link CustomerIORequestError} when the API
 * returns a non-2xx status.
 *
 * @example
 * ```ts
 * import { PipelinesClient, RegionUS } from 'customerio-node';
 *
 * const cdp = new PipelinesClient(writeKey, { region: RegionUS });
 * await cdp.identify({ userId: '123', traits: { email: 'a@example.com' } });
 * await cdp.track({ userId: '123', event: 'Signed Up' });
 * ```
 */
export class PipelinesClient {
  writeKey: string;
  defaults: PipelinesDefaults;
  request: Request;
  pipelinesRoot: string;
  private readonly autoContext: PipelinesContext;

  /**
   * @param writeKey Your Data Pipelines source write key (Data Pipelines -> Sources).
   * @param defaults Optional overrides. Use `region` to select {@link RegionUS} or
   *   {@link RegionEU}, `url` to point at a custom host, `strictMode` to have the API
   *   validate payloads and return real HTTP errors, or `defaultContext` to merge a
   *   base `context` under every call. Accepts any fetch {@link RequestDefaults} field too
   *   (e.g. `timeout`, or `dispatcher` for proxies / custom TLS / keep-alive).
   * @throws {MissingParamError} If `writeKey` is empty.
   * @throws {Error} If `region` is provided and is not a {@link Region} instance.
   */
  constructor(writeKey: string, defaults: Partial<PipelinesDefaults> = {}) {
    if (isEmpty(writeKey)) {
      throw new MissingParamError('writeKey');
    }
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.writeKey = writeKey;
    // Strict mode rides into `defaults.headers` so the `CIORequest.options()`
    // passthrough delivers it on every request. Existing headers on the
    // incoming defaults are preserved.
    const headers = defaults.strictMode ? { ...(defaults.headers ?? {}), 'X-Strict-Mode': '1' } : defaults.headers;
    this.defaults = { ...defaults, headers, region: defaults.region || RegionUS };

    // The Pipelines API authenticates with HTTP Basic where the write key is
    // the username and the password is blank. The existing `CIORequest`
    // BasicAuth helper builds `${siteid}:${apikey}` — we map the write key
    // into `siteid` and leave `apikey` empty so the encoded credential is
    // exactly `base64(writeKey:)`. The field names are an internal artifact
    // and never leak through to the public API.
    //
    // Strip the SDK-only keys; the remainder (the computed `headers`, plus any
    // `dispatcher`/`keepalive`/`timeout`/retry the caller supplied) is fetch
    // init for the transport.
    const {
      region: _region,
      url: _url,
      strictMode: _strictMode,
      defaultContext: _defaultContext,
      ...requestDefaults
    } = this.defaults;
    this.request = new Request({ siteid: writeKey, apikey: '' }, requestDefaults);

    this.pipelinesRoot = this.defaults.url ? this.defaults.url : this.defaults.region.pipelinesUrl;

    this.autoContext = {
      ...(this.defaults.defaultContext ?? {}),
      library: { name: 'customerio-node', version },
    };
  }

  /**
   * Identify a person, creating or updating their traits.
   *
   * @param payload Identify payload. Must include `userId` or `anonymousId`;
   *   `traits` carries the person's attributes.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If neither `userId` nor `anonymousId` is present.
   */
  identify(payload: IdentifyPayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/identify`, this.envelope(payload));
  }

  /**
   * Record an event for a person.
   *
   * @param payload Track payload. Must include `userId` or `anonymousId` and a
   *   non-empty `event` name; `properties` carries event attributes.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `userId`/`anonymousId` or `event` is missing.
   */
  track(payload: TrackPayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    if (isEmpty(payload?.event)) {
      throw new MissingParamError('event');
    }
    return this.request.post(`${this.pipelinesRoot}/track`, this.envelope(payload));
  }

  /**
   * Record a page view (web) for a person.
   *
   * @param payload Page payload. Must include `userId` or `anonymousId`;
   *   optional `name`, `category`, and `properties`.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If neither `userId` nor `anonymousId` is present.
   */
  page(payload: PagePayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/page`, this.envelope(payload));
  }

  /**
   * Record a screen view (mobile) for a person.
   *
   * @param payload Screen payload. Must include `userId` or `anonymousId`;
   *   optional `name`, `category`, and `properties`.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If neither `userId` nor `anonymousId` is present.
   */
  screen(payload: ScreenPayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/screen`, this.envelope(payload));
  }

  /**
   * Associate a person with a group (e.g. an account or organization).
   *
   * @param payload Group payload. Must include `userId` or `anonymousId` and a
   *   non-empty `groupId`; `traits` carries group attributes.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `userId`/`anonymousId` or `groupId` is missing.
   */
  group(payload: GroupPayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    if (isEmpty(payload?.groupId)) {
      throw new MissingParamError('groupId');
    }
    return this.request.post(`${this.pipelinesRoot}/group`, this.envelope(payload));
  }

  /**
   * Merge two identities by aliasing a previous id to a user id.
   *
   * @param payload Alias payload. Must include both `userId` and `previousId`.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `userId` or `previousId` is missing.
   */
  alias(payload: AliasPayload) {
    if (isEmpty(payload?.userId)) {
      throw new MissingParamError('userId');
    }
    if (isEmpty(payload?.previousId)) {
      throw new MissingParamError('previousId');
    }
    return this.request.post(`${this.pipelinesRoot}/alias`, this.envelope(payload));
  }

  /**
   * Send multiple events in a single request. Each item carries a `type`
   * discriminator (`identify`, `track`, `page`, `screen`, `group`, or `alias`)
   * and is enveloped (auto-filled `messageId`/`timestamp`/`context`) individually.
   *
   * @param items A non-empty array of {@link BatchItem} entries.
   * @returns The parsed JSON response body.
   * @throws {MissingParamError} If `items` is not a non-empty array.
   */
  batch(items: BatchItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new MissingParamError('items');
    }
    const batch = items.map((item) => ({ ...this.envelope(item), type: item.type }));
    return this.request.post(`${this.pipelinesRoot}/batch`, { batch });
  }

  // Auto-fills `messageId`, `timestamp`, and `context.library` when the caller
  // hasn't supplied them. Per-call values always win over the auto-fill and
  // over `defaultContext`.
  private envelope<T extends PipelinesCommon>(payload: T): T {
    const merged: PipelinesContext = {
      ...this.autoContext,
      ...(payload.context ?? {}),
    };
    // `context.library` is a sub-object — preserve per-call override
    // explicitly so a partial `context: { ip: '...' }` doesn't drop the
    // auto-filled library identifier.
    merged.library = payload.context?.library ?? this.autoContext.library;

    return {
      ...payload,
      messageId: payload.messageId ?? randomUUID(),
      timestamp: payload.timestamp ?? new Date().toISOString(),
      context: merged,
    };
  }
}

export type {
  AliasPayload,
  BatchItem,
  GroupPayload,
  IdentifyPayload,
  PagePayload,
  PipelinesCommon,
  PipelinesContext,
  ScreenPayload,
  TrackPayload,
} from './pipelines/payloads';
