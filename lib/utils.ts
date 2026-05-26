import { IdentifierType } from '../lib/types';

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
 * Minimal response shape attached to a {@link CustomerIORequestError}. Replaces
 * the previous `http.IncomingMessage` so the public error type stays portable
 * across runtimes that don't expose Node's stream-based response object.
 */
export interface ResponseLike {
  statusCode: number;
  headers: Record<string, string>;
  ok: boolean;
}

/**
 * Thrown when the Customer.io API responds with a non-2xx status.
 *
 * The error message is derived from the API response body when possible. The
 * raw status code, response, and body are exposed for programmatic handling
 * (e.g. retry on 5xx, ignore on 404).
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

  static composeMessage(json: Record<string, any> | null): string {
    if (!json) {
      return 'Unknown error';
    }

    if (json.meta && json.meta.error) {
      return json.meta.error;
    } else if (json.meta && json.meta.errors) {
      const count = json.meta.errors.length;

      return `${count} ${count === 1 ? 'error' : 'errors'}:
${json.meta.errors.map((error: string) => `  - ${error}`).join('\n')}`;
    }

    return 'Unknown error';
  }

  constructor(json: Record<string, any> | null, statusCode: number, response: ResponseLike, body: string) {
    super(CustomerIORequestError.composeMessage(json));

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
