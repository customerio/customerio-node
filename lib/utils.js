import { IdentifierType } from './types.js';

/**
 * @param {string | number | null | undefined} value
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return !Number.isFinite(value);
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isIdentifierType = (value) => {
  return Object.values(IdentifierType).includes(/** @type {any} */ (value));
};

export class CustomerIORequestError extends Error {
  /**
   * @param {Record<string, any> | null} json
   * @returns {string}
   */
  static composeMessage(json) {
    if (!json) {
      return 'Unknown error';
    }

    if (json.meta && json.meta.error) {
      return json.meta.error;
    } else if (json.meta && json.meta.errors) {
      const count = json.meta.errors.length;

      return `${count} ${count === 1 ? 'error' : 'errors'}:
${json.meta.errors.map(/** @param {string} error */ (error) => `  - ${error}`).join('\n')}`;
    }

    return 'Unknown error';
  }

  /** @type {number} */
  statusCode;
  /** @type {import('http').IncomingMessage} */
  response;
  /** @type {string} */
  body;

  /**
   * @param {Record<string, any> | null} json
   * @param {number} statusCode
   * @param {import('http').IncomingMessage} response
   * @param {string} body
   */
  constructor(json, statusCode, response, body) {
    super(CustomerIORequestError.composeMessage(json));

    this.name = 'CustomerIORequestError';
    this.statusCode = statusCode;
    this.response = response;
    this.body = body;
  }
}

/**
 * @template {Record<string, unknown>} T
 * @param {T} source
 * @param {ReadonlyArray<keyof T>} keys
 * @returns {Partial<T>}
 */
export function pickDefined(source, keys) {
  /** @type {Partial<T>} */
  const result = {};
  for (const key of keys) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

export class MissingParamError extends Error {
  /** @param {string} param */
  constructor(param) {
    super(`${param} is required`);
    this.name = 'MissingParamError';
  }
}
