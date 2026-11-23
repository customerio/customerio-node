import { IdentifierType } from '../lib/types';
import { RegionUS, RegionEU } from './regions';
import type { Region } from './regions';

/** Returns `true` for `null`, `undefined`, an empty/whitespace string, or a non-finite number. */
export const isEmpty = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return !Number.isFinite(value);
};

/** Returns `true` if `value` is one of the {@link IdentifierType} enum values. */
export const isIdentifierType = (value: unknown) => {
  return Object.values(IdentifierType).includes(value as IdentifierType);
};

/**
 * Returns `true` if `value` is a valid object identifier kind (`object_id` or
 * `cio_object_id`). Objects use a different id vocabulary than people, so this
 * is intentionally separate from {@link isIdentifierType}.
 */
export const isObjectIdType = (value: unknown) => {
  return value === 'object_id' || value === 'cio_object_id';
};

/**
 * Build a URL query string from a map of parameters.
 *
 * `null` and `undefined` values are omitted (so optional params disappear
 * rather than serializing as empty). Keys and values are URL-encoded. Returns
 * a leading-`?` string (e.g. `?a=1&b=2`) when at least one param is present,
 * or an empty string when none are.
 */
export const buildQueryString = (params: Record<string, string | number | boolean | null | undefined>): string => {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }

  return parts.length > 0 ? `?${parts.join('&')}` : '';
};

/**
 * Minimal response shape attached to a {@link CustomerIORequestError}. Replaces
 * the previous `http.IncomingMessage` so the public error type stays portable
 * across runtimes that don't expose Node's stream-based response object.
 */
export interface ResponseLike {
  statusCode: number;
  headers: Record<string, string>;
  ok: boolean;
}

function listErrors(errors: string[]): string {
  const count = errors.length;

  return `${count} ${count === 1 ? 'error' : 'errors'}:
${errors.map((error) => `  - ${error}`).join('\n')}`;
}

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

// Formats one Pipelines strict-mode error as `batch[2].event: must provide
// value for required field`. `index` is the item's position in a batch.
function pipelinesError(error: any): string {
  const message = asString(error?.message);
  if (!message) {
    return '';
  }

  const index = Number.isInteger(error.index) ? `batch[${error.index}]` : '';
  const where = [index, asString(error.field)].filter(Boolean).join('.');

  return where ? `${where}: ${message}` : message;
}

function isJSON(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Thrown when the Customer.io API responds with a non-2xx status.
 *
 * The error message is derived from the API response body when possible. The
 * raw status code, response, and body are exposed for programmatic handling
 * (e.g. retry on 5xx, ignore on 404).
 *
 * @remarks
 * This is only thrown for HTTP responses with a non-2xx status. Transport-level
 * failures (DNS, connection reset, refused) and timeouts are surfaced as the
 * native `fetch` errors — `TypeError('fetch failed')` (with the underlying
 * cause on `.cause`) and `DOMException('TimeoutError')` respectively — not as a
 * `CustomerIORequestError`.
 *
 * @example
 * ```ts
 * try {
 *   await cio.identify('123', { email: 'a@example.com' });
 * } catch (err) {
 *   if (err instanceof CustomerIORequestError && err.statusCode === 404) {
 *     // customer not found, fall through
 *   } else {
 *     throw err;
 *   }
 * }
 * ```
 */
export class CustomerIORequestError extends Error {
  /** HTTP status code returned by the API. */
  statusCode: number;
  /** Portable response metadata ({@link ResponseLike}: status, lowercased headers, `ok`). */
  response: ResponseLike;
  /** The raw response body as a string. May be empty. */
  body: string;

  /**
   * Builds the error message from a response. The Track and App API formats
   * are read first, then the Pipelines API formats, then a plain-text body,
   * then the status code.
   */
  static composeMessage(json: Record<string, any> | null, body?: string, statusCode?: number): string {
    if (json?.meta && json.meta.error) {
      return json.meta.error;
    } else if (json?.meta && json.meta.errors) {
      return listErrors(json.meta.errors);
    }

    // The App API reports auth failures as `{ errors: [{ detail, status }] }`.
    const detail = Array.isArray(json?.errors) ? json.errors[0]?.detail : undefined;
    if (typeof detail === 'string' && detail) {
      return detail;
    }

    // Pipelines API failures look like `{ success: false, code, message }`.
    const message = [asString(json?.code), asString(json?.message)].filter(Boolean).join(': ');
    if (message) {
      return message;
    }

    // Pipelines API strict mode reports `{ errors: [{ index?, reason, field, message }] }`.
    const errors = Array.isArray(json?.errors) ? json.errors.map(pipelinesError).filter(Boolean) : [];
    if (errors.length === 1) {
      return errors[0];
    } else if (errors.length > 1) {
      return listErrors(errors);
    }

    const text = body?.trim();
    if (text && !isJSON(text)) {
      return text;
    }

    return statusCode ? `Request failed with status ${statusCode}` : 'Unknown error';
  }

  constructor(json: Record<string, any> | null, statusCode: number, response: ResponseLike, body: string) {
    super(CustomerIORequestError.composeMessage(json, body, statusCode));

    this.name = 'CustomerIORequestError';
    this.statusCode = statusCode;
    this.response = response;
    this.body = body;
  }
}

export function pickDefined<T extends Record<string, unknown>>(source: T, keys: ReadonlyArray<keyof T>): Partial<T> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Thrown synchronously by SDK methods when a required parameter is missing.
 *
 * The `message` is always `"<paramName> is required"`.
 */
export class MissingParamError extends Error {
  constructor(param: string) {
    super(`${param} is required`);
    this.name = 'MissingParamError';
  }
}

/** What a {@link KeyCapabilityError} says the key can't do. */
export type KeyCapability = 'track' | 'transactional';

/**
 * Thrown by {@link CustomerIO} when its key can't do what a method asks.
 *
 * Thrown before the request when the key's type rules it out (a public `pk_`
 * key can't send transactional messages). Otherwise the server's 401 or 403 is
 * rethrown as this error, with the original {@link CustomerIORequestError} on
 * `cause`.
 */
export class KeyCapabilityError extends Error {
  /** What the key can't do. */
  capability: KeyCapability;
  /** The HTTP status, when the server refused the key. */
  statusCode?: number;

  constructor(capability: KeyCapability, message: string, cause?: CustomerIORequestError) {
    super(message, { cause });
    this.name = 'KeyCapabilityError';
    this.capability = capability;
    this.statusCode = cause?.statusCode;
  }
}

type KeyInfo = { kind: 'public' | 'secret'; region: Region } | null;

// Keys in the shared format look like `{type}_{us|eu}_{random}_{checksum}`,
// where type is `pk` (public) or `sk` (secret). The server checks the
// checksum; the SDK only reads the prefix to pick a host and spot public keys.
const KEY_PREFIX = /^(pk|sk)_(us|eu)_/;

export function regionName(region: Region): 'us' | 'eu' | null {
  if (region.trackUrl === RegionUS.trackUrl) {
    return 'us';
  }
  if (region.trackUrl === RegionEU.trackUrl) {
    return 'eu';
  }

  return null;
}

// The key travels as a Bearer token, so an override must not send it in clear text.
export function requireHttps(name: string, url: string | undefined) {
  // An empty string falls back to the region host, as before.
  if (!url) {
    return;
  }

  let protocol: string;
  try {
    ({ protocol } = new URL(url));
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
  if (protocol !== 'https:') {
    throw new Error(`${name} must start with https://`);
  }
}

export function parseKey(key: string): KeyInfo {
  const match = KEY_PREFIX.exec(key);
  if (!match) {
    return null;
  }

  return { kind: match[1] === 'pk' ? 'public' : 'secret', region: match[2] === 'eu' ? RegionEU : RegionUS };
}
