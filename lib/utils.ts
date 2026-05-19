import type { IncomingMessage } from 'http';
import { IdentifierType } from '../lib/types';

export const isEmpty = (value: unknown) => {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
};

export const isIdentifierType = (value: unknown) => {
  return Object.values(IdentifierType).includes(value as IdentifierType);
};

export class CustomerIORequestError extends Error {
  statusCode: number;
  response: IncomingMessage;
  body: string;

  static composeMessage(json: Record<string, unknown> | null): string {
    if (!json) {
      return 'Unknown error';
    }

    const meta = json.meta as { error?: string; errors?: string[] } | undefined;

    if (meta?.error) {
      return meta.error;
    } else if (meta?.errors) {
      const count = meta.errors.length;

      return `${count} ${count === 1 ? 'error' : 'errors'}:
${meta.errors.map((error: string) => `  - ${error}`).join('\n')}`;
    }

    return 'Unknown error';
  }

  constructor(json: Record<string, unknown> | null, statusCode: number, response: IncomingMessage, body: string) {
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
