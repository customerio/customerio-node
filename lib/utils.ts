import { IdentifierType } from '../lib/types';

export const isEmpty = (value: unknown) => {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
};

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

export class CustomerIORequestError extends Error {
  statusCode: number;
  response: ResponseLike;
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

export class MissingParamError extends Error {
  constructor(param: string) {
    super(param);
    this.message = `${param} is required`;
  }
}
