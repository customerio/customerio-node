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

    this.defaults = Object.assign(
      {
        timeout: TIMEOUT,
      },
      defaults,
    );
  }

  options(uri: string, method: RequestOptions['method'], data?: RequestData): RequestHandlerOptions {
    const body = data ? JSON.stringify(data) : null;
    const headers = {
      Authorization: this.auth,
      'Content-Type': 'application/json',
      'Content-Length': body ? Buffer.byteLength(body, 'utf8') : 0,
      'User-Agent': `Customer.io Node Client/${version}`,
    };

    return { method, uri, headers, body };
  }

  handler({ uri, body, method, headers }: RequestHandlerOptions): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      let url = new URL(uri);
      let options = Object.assign<{}, RequestOptions, RequestOptions>({}, this.defaults, {
        method,
        headers,
        hostname: url.hostname,
        path: url.pathname,
      });
      let req = request(options, (res) => {
        let chunks: Buffer[] = [];

        res.on('data', (data: Buffer) => {
          chunks.push(data);
        });

        res.on('end', () => {
          let body = Buffer.concat(chunks).toString('utf-8');
          let json = null;

          try {
            if (body && body.length) {
              json = JSON.parse(body);
            }
          } catch (error) {
            const message = `Unable to parse JSON. Error: ${error} \nBody:\n ${body}`;

            return reject(new Error(message));
          }

          if (res.statusCode == 200 || res.statusCode == 201) {
            resolve(json);
          } else {
            reject(new CustomerIORequestError(json, res.statusCode || 0, res, body));
          }
        });
      });

      req.on('error', (error: any) => {
        reject(error);
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
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
