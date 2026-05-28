import type { IncomingMessage } from 'http';
import { IdentifierType } from './types';

export const isEmpty = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return !Number.isFinite(value);
};

export const isIdentifierType = (value: unknown) => {
  return Object.values(IdentifierType).includes(value as IdentifierType);
};

export class CustomerIORequestError extends Error {
  statusCode: number;
  response: IncomingMessage;
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

  constructor(json: Record<string, any> | null, statusCode: number, response: IncomingMessage, body: string) {
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

export class MissingParamError extends Error {
  constructor(param: string) {
    super(`${param} is required`);
    this.name = 'MissingParamError';
  }
}
