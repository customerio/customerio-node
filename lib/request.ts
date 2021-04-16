import request from 'request';
import type { Request, RequiredUriUrl, RequestAPI, CoreOptions } from 'request';

export type BasicAuth = {
  apikey: string;
  siteid: string;
};

export type BearerAuth = string;

export type RequestAuth = BasicAuth | BearerAuth;
export type RequestDefaults = CoreOptions;
export type RequestOptions = CoreOptions & RequiredUriUrl;
export type RequestData = Record<string, any> | undefined;

const TIMEOUT = 10_000;

export default class CIORequest {
  apikey?: BasicAuth['apikey'];
  siteid?: BasicAuth['siteid'];
  appKey?: BearerAuth;
  auth: string;
  defaults: RequestDefaults;

  private request: RequestAPI<Request, CoreOptions, RequiredUriUrl>;

  constructor(auth: RequestAuth, defaults?: RequestDefaults) {
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

    this.request = request.defaults(this.defaults);
  }

  options(uri: string, method: CoreOptions['method'], data?: RequestData) {
    const headers = {
      Authorization: this.auth,
      'Content-Type': 'application/json',
    };
    const body = data ? JSON.stringify(data) : null;
    const options: RequestOptions = { method, uri, headers, body };

    if (!body) delete options.body;

    return options;
  }

  handler(options: RequestOptions) {
    return new Promise((resolve, reject) => {
      this.request(options, (error, response, body) => {
        if (error) return reject(error);

        let json = null;
        try {
          if (body) json = JSON.parse(body);
        } catch (e) {
          const message = `Unable to parse JSON. Error: ${e} \nBody:\n ${body}`;
          return reject(new Error(message));
        }

        if (response.statusCode == 200 || response.statusCode == 201) {
          resolve(json);
        } else {
          reject({
            message: (json && json.meta && json.meta.error) || 'Unknown error',
            statusCode: response.statusCode,
            response: response,
            body: body,
          });
        }
      });
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
