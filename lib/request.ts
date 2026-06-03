import type { RequestOptions } from 'https';
import { CustomerIORequestError } from './utils';
import { version } from './version';

export type BasicAuth = {
  apikey: string;
  siteid: string;
};

export type BearerAuth = string;

export type RequestAuth = BasicAuth | BearerAuth;
export type RequestData = Record<string, any> | undefined;
export type RequestHandlerOptions = {
  method: RequestOptions['method'];
  uri: string;
  headers: RequestOptions['headers'];
  body?: string | null;
};
export interface PushRequestData {
  delivery_id?: string;
  device_id?: string;
  event?: 'delivered' | 'opened' | 'converted';
  timestamp?: number;
}

const TIMEOUT = 10_000;
const REDIRECT_STATUSES = new Set([301, 302, 307, 308]);

export default class CIORequest {
  apikey?: BasicAuth['apikey'];
  siteid?: BasicAuth['siteid'];
  appKey?: BearerAuth;
  auth: string;
  defaults: RequestOptions;

  constructor(auth: RequestAuth, defaults?: RequestOptions) {
    if (typeof auth === 'object') {
      this.apikey = auth.apikey;
      this.siteid = auth.siteid;

      this.auth = `Basic ${Buffer.from(`${this.siteid}:${this.apikey}`, 'utf8').toString('base64')}`;
    } else {
      this.appKey = auth;
      this.auth = `Bearer ${this.appKey}`;
    }

    this.defaults = {
      timeout: TIMEOUT,
      ...defaults,
    };
  }

  options(uri: string, method: RequestOptions['method'], data?: RequestData): RequestHandlerOptions {
    const body = data ? JSON.stringify(data) : null;
    // Per-client custom headers (e.g. `X-Strict-Mode` for the Pipelines
    // client) can be supplied via `defaults.headers`. They're merged in
    // first so the standard headers below always win and cannot be
    // clobbered. The cast is needed because `OutgoingHttpHeaders` has both
    // named properties (with narrower types like `string | string[]`) and
    // an index signature — spreading it into a literal that mixes those
    // values with our own `number`-typed `Content-Length` confuses tsc.
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

  async handler({ uri, body, method, headers }: RequestHandlerOptions): Promise<Record<string, any>> {
    // Network failures and timeouts surface as native fetch errors:
    //   - DNS / refused / reset → `TypeError("fetch failed")` with the underlying
    //     SystemError (carrying `.code`) on `.cause`.
    //   - Timeout → `DOMException("TimeoutError")` from `AbortSignal.timeout`.
    // These are intentionally not translated; callers should inspect `name`,
    // `cause`, and `cause.code` rather than relying on the legacy error shapes.
    const response = await fetch(uri, {
      method,
      headers: headers as Record<string, string>,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(this.defaults.timeout as number),
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
          redirectHeaders = rest as RequestOptions['headers'];
        }
      } catch {
        // No need to do anything if the URL is malformed or relative
      }

      return this.handler({ uri: newURI, body, method, headers: redirectHeaders });
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
