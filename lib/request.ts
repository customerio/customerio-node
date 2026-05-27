import { request } from 'https';
import type { RequestOptions } from 'https';
import { URL } from 'url';
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
    const headers: Record<string, string | number> = {
      Authorization: this.auth,
      'Content-Type': 'application/json',
      'User-Agent': `Customer.io Node Client/${version}`,
    };

    if (body) {
      headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
    }

    return { method, uri, headers, body };
  }

  handler({ uri, body, method, headers }: RequestHandlerOptions): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const url = new URL(uri);
      const options: RequestOptions = {
        ...this.defaults,
        method,
        headers,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
      };
      const req = request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (data: Buffer) => {
          chunks.push(data);
        });

        res.on('end', () => {
          const responseBody = Buffer.concat(chunks).toString('utf-8');
          let json: Record<string, any> = {};

          if ([301, 302, 307, 308].includes(res.statusCode ?? 0)) {
            const newURI = res.headers.location;

            if (newURI == null) {
              return reject(new Error(`Received a ${res.statusCode} status, but no Location header was present`));
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
            } catch (err) {
              // No need to do anything if the URL is malformed or relative
            }

            return this.handler({ uri: newURI, body, method, headers: redirectHeaders }).then(resolve).catch(reject);
          }

          try {
            if (responseBody && responseBody.length) {
              json = JSON.parse(responseBody);
            }
          } catch (error) {
            const message = `Unable to parse JSON. Error: ${error} \nBody:\n ${responseBody}`;

            return reject(new Error(message));
          }

          if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new CustomerIORequestError(json, res.statusCode || 0, res, responseBody));
          }
        });
      });

      req.on('error', (error: Error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy(new Error(`Request timed out after ${options.timeout}ms`));
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
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
