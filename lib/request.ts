import { CustomerIORequestError } from './utils';
import { version } from './version';

export interface BasicAuth {
  apikey: string;
  siteid: string;
}

export type BearerAuth = string;

export type RequestAuth = BasicAuth | BearerAuth;
export type RequestData = Record<string, any> | undefined;

/**
 * Options forwarded to the underlying `fetch` call.
 *
 * This is the native fetch `RequestInit`, minus the fields the SDK owns and
 * sets itself (`method`, `body`, `signal`, `redirect`), plus a convenience
 * `timeout`. `headers` is narrowed to a plain record since that's the only
 * shape the SDK ever merges.
 *
 * Use `dispatcher` (an undici `Agent` / `ProxyAgent`) for HTTP(S) proxies,
 * custom TLS (mTLS or a private CA), or connection keep-alive — it is the
 * fetch-era replacement for the `https.Agent` knob that the old transport
 * accepted but `fetch` cannot honor.
 */
export type RequestDefaults = Omit<RequestInit, 'method' | 'body' | 'signal' | 'redirect' | 'headers'> & {
  /** Per-request headers merged into every call. SDK headers always win on conflict. */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds. Defaults to `10000`. */
  timeout?: number;
};

export interface RequestHandlerOptions {
  method: string;
  uri: string;
  headers: Record<string, string | number>;
  body?: string | null;
}
export interface PushRequestData {
  delivery_id?: string;
  device_id?: string;
  event?: 'delivered' | 'opened' | 'converted';
  timestamp?: number;
}

/**
 * Per-request retry policy. Retries are stateless and happen at the HTTP layer,
 * so every client (`TrackClient`, `APIClient`, `PipelinesClient`) inherits them.
 */
export type RetryOptions = {
  /** Maximum number of retries after the initial attempt. `0` disables retries. */
  maxRetries: number;
  /** Lower bound for the exponential backoff window, in milliseconds. */
  minTimeoutMs: number;
  /** Upper bound (cap) for a single backoff sleep, in milliseconds. */
  maxTimeoutMs: number;
  /** HTTP status codes that are considered transient and worth retrying. */
  retryStatusCodes: number[];
  /** When `true`, honor a `Retry-After` response header in place of the backoff. */
  respectRetryAfter: boolean;
  /** Ceiling applied to a `Retry-After` value, in seconds. */
  retryAfterMaxSeconds: number;
  /** Cumulative cap across all backoff sleeps for one call, in milliseconds. */
  maxTotalBackoffMs: number;
};

const TIMEOUT = 10_000;
const REDIRECT_STATUSES = new Set([301, 302, 307, 308]);
const RETRY_COUNT_HEADER = 'X-Retry-Count';

export const DEFAULT_RETRY: RetryOptions = {
  maxRetries: 3,
  minTimeoutMs: 200,
  maxTimeoutMs: 5_000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504, 522, 524],
  respectRetryAfter: true,
  retryAfterMaxSeconds: 300,
  maxTotalBackoffMs: 30_000,
};

export default class CIORequest {
  apikey?: BasicAuth['apikey'];
  siteid?: BasicAuth['siteid'];
  appKey?: BearerAuth;
  auth: string;
  defaults: RequestDefaults;
  retry: RetryOptions;

  constructor(auth: RequestAuth, defaults?: RequestDefaults & { retry?: Partial<RetryOptions> }) {
    if (typeof auth === 'object') {
      this.apikey = auth.apikey;
      this.siteid = auth.siteid;

      this.auth = `Basic ${Buffer.from(`${this.siteid}:${this.apikey}`, 'utf8').toString('base64')}`;
    } else {
      this.appKey = auth;
      this.auth = `Bearer ${this.appKey}`;
    }

    // `retry` is kept off `this.defaults` so the latter stays a pure fetch
    // `RequestInit` bag (plus `timeout`) that is forwarded to `fetch` untouched.
    const { retry, ...requestDefaults } = defaults ?? {};
    this.defaults = {
      timeout: TIMEOUT,
      ...requestDefaults,
    };
    this.retry = { ...DEFAULT_RETRY, ...retry };
  }

  options(uri: string, method: string, data?: RequestData): RequestHandlerOptions {
    const body = data ? JSON.stringify(data) : null;
    // Per-client custom headers (e.g. `X-Strict-Mode` for the Pipelines
    // client) can be supplied via `defaults.headers`. They're merged in
    // first so the standard headers below always win and cannot be
    // clobbered. The widening cast lets us mix our own `number`-typed
    // `Content-Length` into the same record as the string-valued headers.
    const customHeaders = (this.defaults.headers ?? {}) as Record<string, string | number>;
    const headers: Record<string, string | number> = {
      ...customHeaders,
      Authorization: this.auth,
      'Content-Type': 'application/json',
      'User-Agent': `Customer.io Node Client/${version}`,
    };

    if (body) {
      headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
    }

    return { method, uri, headers, body };
  }

  private async execute({ uri, body, method, headers }: RequestHandlerOptions): Promise<Record<string, any>> {
    // Network failures and timeouts surface as native fetch errors:
    //   - DNS / refused / reset → `TypeError("fetch failed")` with the underlying
    //     SystemError (carrying `.code`) on `.cause`.
    //   - Timeout → `DOMException("TimeoutError")` from `AbortSignal.timeout`.
    // These are intentionally not translated; callers should inspect `name`,
    // `cause`, and `cause.code` rather than relying on the legacy error shapes.
    //
    // User-supplied fetch init (`dispatcher`, `keepalive`, …) is forwarded via
    // the spread. `headers` and `timeout` are handled specially, and the
    // SDK-owned fields (`method`, `body`, `redirect`, `signal`) are applied
    // after the spread so a caller can never override them.
    const { headers: _headers, timeout, ...fetchInit } = this.defaults;
    const response = await fetch(uri, {
      ...fetchInit,
      method,
      headers: headers as Record<string, string>,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeout as number),
    });

    const statusCode = response.status;

    if (REDIRECT_STATUSES.has(statusCode)) {
      // Drain the body to free the connection; we don't need it for redirects.
      await response.text();

      const newURI = response.headers.get('location');
      if (newURI == null) {
        throw new Error(`Received a ${statusCode} status, but no Location header was present`);
      }

      // Strip the Authorization header when the redirect target is not a
      // customer.io host, so we don't leak credentials to a host the
      // caller never intended to authenticate against. Cross-data-center
      // redirects (e.g. US → EU) stay within `*.customer.io` and must
      // continue to carry the Authorization header.
      let redirectHeaders = headers;
      try {
        const newHostname = new URL(newURI).hostname;
        if (!newHostname.endsWith('.customer.io') && headers && 'Authorization' in headers) {
          const { Authorization: _stripped, ...rest } = headers as Record<string, unknown>;
          redirectHeaders = rest as Record<string, string | number>;
        }
      } catch {
        // No need to do anything if the URL is malformed or relative
      }

      return this.execute({ uri: newURI, body, method, headers: redirectHeaders });
    }

    const responseBody = await response.text();
    let json: Record<string, any> = {};

    try {
      if (responseBody && responseBody.length) {
        json = JSON.parse(responseBody);
      }
    } catch (error) {
      throw new Error(`Unable to parse JSON. Error: ${error} \nBody:\n ${responseBody}`);
    }

    if (statusCode >= 200 && statusCode < 300) {
      return json;
    }

    const responseLike = {
      statusCode,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
    };
    throw new CustomerIORequestError(json, statusCode, responseLike, responseBody);
  }

  // `attempt` and `totalBackoff` are internal recursion state: callers invoke
  // `handler(options)` and the retry loop threads them through on each replay.
  async handler(
    options: RequestHandlerOptions,
    /** @internal */ attempt = 0,
    /** @internal */ totalBackoff = 0,
  ): Promise<Record<string, any>> {
    // Tag retries so the server (and our own logs) can tell an original
    // request apart from a replay. The first attempt is left untouched.
    const attemptOptions =
      attempt === 0 ? options : { ...options, headers: { ...options.headers, [RETRY_COUNT_HEADER]: attempt } };

    try {
      return await this.execute(attemptOptions);
    } catch (error) {
      if (attempt >= this.retry.maxRetries || !this.isRetryable(error)) {
        throw error;
      }

      const delay = this.computeBackoff(attempt, error);

      // Stop before sleeping past the per-call backoff budget; better to
      // surface the last error than block a caller indefinitely.
      if (totalBackoff + delay > this.retry.maxTotalBackoffMs) {
        throw error;
      }

      await this.sleep(delay);
      return this.handler(options, attempt + 1, totalBackoff + delay);
    }
  }

  /**
   * Whether a failed attempt is worth replaying. Transient HTTP statuses and
   * native fetch failures (network drop, DNS, timeout) retry; deterministic
   * errors we raise ourselves (bad redirect, unparseable JSON) do not.
   */
  private isRetryable(error: unknown): boolean {
    if (error instanceof CustomerIORequestError) {
      return this.retry.retryStatusCodes.includes(error.statusCode);
    }

    // `fetch` rejects network failures as `TypeError("fetch failed")` and
    // `AbortSignal.timeout` aborts surface as `DOMException("TimeoutError")`.
    if (error instanceof TypeError) {
      return true;
    }

    return error instanceof DOMException && error.name === 'TimeoutError';
  }

  /** Milliseconds to wait before the next attempt. */
  private computeBackoff(attempt: number, error: unknown): number {
    const retryAfterMs = this.retryAfterDelay(error);
    if (retryAfterMs != null) {
      return retryAfterMs;
    }

    // Exponential backoff with a jitter multiplier in [1, 2), matching the
    // Segment / cdp-analytics SDK formula, capped at `maxTimeoutMs`.
    const { minTimeoutMs, maxTimeoutMs } = this.retry;
    const jitter = Math.random() + 1;
    return Math.min(maxTimeoutMs, jitter * minTimeoutMs * 2 ** attempt);
  }

  /**
   * Parse a `Retry-After` header (delay-seconds or HTTP-date) from a rejected
   * response, clamped to `retryAfterMaxSeconds`. Returns `null` when the header
   * is absent, unparseable, or `respectRetryAfter` is disabled.
   */
  private retryAfterDelay(error: unknown): number | null {
    if (!this.retry.respectRetryAfter || !(error instanceof CustomerIORequestError)) {
      return null;
    }

    const raw = error.response.headers['retry-after'];
    if (raw == null) {
      return null;
    }

    let seconds = Number(raw);
    if (!Number.isFinite(seconds)) {
      const dateMs = Date.parse(raw);
      if (Number.isNaN(dateMs)) {
        return null;
      }
      seconds = (dateMs - Date.now()) / 1000;
    }

    seconds = Math.max(0, Math.min(seconds, this.retry.retryAfterMaxSeconds));
    return seconds * 1000;
  }

  /** Resolves after `ms` milliseconds. Isolated so tests can stub the wait. */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  get(uri: string) {
    return this.handler(this.options(uri, 'GET'));
  }

  put(uri: string, data: RequestData = {}) {
    return this.handler(this.options(uri, 'PUT', data));
  }

  destroy(uri: string) {
    return this.handler(this.options(uri, 'DELETE'));
  }

  post(uri: string, data: RequestData = {}) {
    return this.handler(this.options(uri, 'POST', data));
  }
}
