import https from 'https';
import { URL } from 'url';
import { CustomerIORequestError } from './utils.js';
import { version } from './version.js';

/** @typedef {{ apikey: string; siteid: string }} BasicAuth */
/** @typedef {string} BearerAuth */
/** @typedef {BasicAuth | BearerAuth} RequestAuth */
/** @typedef {Record<string, any> | undefined} RequestData */
/** @typedef {{ method: import('https').RequestOptions['method']; uri: string; headers: import('https').RequestOptions['headers']; body?: string | null }} RequestHandlerOptions */

/**
 * @typedef {object} PushRequestData
 * @property {string} [delivery_id]
 * @property {string} [device_id]
 * @property {'delivered' | 'opened' | 'converted'} [event]
 * @property {number} [timestamp]
 */

const TIMEOUT = 10_000;

export default class CIORequest {
  /** @type {string | undefined} */
  apikey;
  /** @type {string | undefined} */
  siteid;
  /** @type {string | undefined} */
  appKey;
  /** @type {string} */
  auth;
  /** @type {import('https').RequestOptions} */
  defaults;

  /**
   * @param {RequestAuth} auth
   * @param {import('https').RequestOptions} [defaults]
   */
  constructor(auth, defaults) {
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

  /**
   * @param {string} uri
   * @param {import('https').RequestOptions['method']} method
   * @param {RequestData} [data]
   * @returns {RequestHandlerOptions}
   */
  options(uri, method, data) {
    const body = data ? JSON.stringify(data) : null;
    const customHeaders = /** @type {Record<string, string | number>} */ (this.defaults.headers ?? {});
    /** @type {Record<string, string | number>} */
    const headers = {
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

  /**
   * @param {RequestHandlerOptions} options
   * @returns {Promise<Record<string, any>>}
   */
  handler({ uri, body, method, headers }) {
    return new Promise((resolve, reject) => {
      const url = new URL(uri);
      /** @type {import('https').RequestOptions} */
      const options = {
        ...this.defaults,
        method,
        headers,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
      };
      const req = https.request(options, (res) => {
        /** @type {Buffer[]} */
        const chunks = [];

        res.on(
          'data',
          /** @param {Buffer} data */ (data) => {
            chunks.push(data);
          },
        );

        res.on('end', () => {
          const responseBody = Buffer.concat(chunks).toString('utf-8');
          /** @type {Record<string, any>} */
          let json = {};

          if ([301, 302, 307, 308].includes(res.statusCode ?? 0)) {
            const newURI = res.headers.location;

            if (newURI == null) {
              return reject(new Error(`Received a ${res.statusCode} status, but no Location header was present`));
            }

            let redirectHeaders = headers;
            try {
              const newHostname = new URL(newURI).hostname;
              if (!newHostname.endsWith('.customer.io') && headers && 'Authorization' in headers) {
                const { Authorization: _stripped, ...rest } = /** @type {Record<string, unknown>} */ (headers);
                redirectHeaders = /** @type {import('https').RequestOptions['headers']} */ (rest);
              }
              /* c8 ignore next 3 */
            } catch (_err) {
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

      req.on(
        'error',
        /** @param {Error} error */ (error) => {
          reject(error);
        },
      );

      req.on('timeout', () => {
        req.destroy(new Error(`Request timed out after ${options.timeout}ms`));
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /** @param {string} uri */
  get(uri) {
    return this.handler(this.options(uri, 'GET'));
  }

  /**
   * @param {string} uri
   * @param {RequestData} [data]
   */
  put(uri, data = {}) {
    return this.handler(this.options(uri, 'PUT', data));
  }

  /** @param {string} uri */
  destroy(uri) {
    return this.handler(this.options(uri, 'DELETE'));
  }

  /**
   * @param {string} uri
   * @param {RequestData} [data]
   */
  post(uri, data = {}) {
    return this.handler(this.options(uri, 'POST', data));
  }
}
