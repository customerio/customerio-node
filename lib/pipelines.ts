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

export class PipelinesClient {
  writeKey: string;
  defaults: PipelinesDefaults;
  request: Request;
  pipelinesRoot: string;
  private readonly autoContext: PipelinesContext;

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

  identify(payload: IdentifyPayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/identify`, this.envelope(payload));
  }

  track(payload: TrackPayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    if (isEmpty(payload?.event)) {
      throw new MissingParamError('event');
    }
    return this.request.post(`${this.pipelinesRoot}/track`, this.envelope(payload));
  }

  page(payload: PagePayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/page`, this.envelope(payload));
  }

  screen(payload: ScreenPayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/screen`, this.envelope(payload));
  }

  group(payload: GroupPayload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    if (isEmpty(payload?.groupId)) {
      throw new MissingParamError('groupId');
    }
    return this.request.post(`${this.pipelinesRoot}/group`, this.envelope(payload));
  }

  alias(payload: AliasPayload) {
    if (isEmpty(payload?.userId)) {
      throw new MissingParamError('userId');
    }
    if (isEmpty(payload?.previousId)) {
      throw new MissingParamError('previousId');
    }
    return this.request.post(`${this.pipelinesRoot}/alias`, this.envelope(payload));
  }

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
