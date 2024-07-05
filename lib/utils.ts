import { IncomingMessage } from 'http';
import { createHmac, timingSafeEqual } from 'crypto';
import { IdentifierType } from '../lib/types';

export const isEmpty = (value: unknown) => {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
};

export const cleanEmail = (email: string) => {
  return email.split('@').map(encodeURIComponent).join('@');
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

export class MissingParamError extends Error {
  constructor(param: string) {
    super(param);
    this.message = `${param} is required`;
  }
}

export const verifyWebhookSignature = (
  webhookSigningSecret: string,
  timestamp: string,
  signature: string,
  payload: Buffer,
): boolean => {
  if (isEmpty(webhookSigningSecret) || isEmpty(timestamp) || isEmpty(signature) || isEmpty(payload)) {
    throw new MissingParamError('webhookSigningSecret, timestamp, signature, payload');
  }

  const hmac = createHmac('sha256', webhookSigningSecret);
  hmac.update(`v0:${timestamp}:`);
  hmac.update(payload);

  const hash = hmac.digest();
  return timingSafeEqual(hash, Buffer.from(signature, 'hex'));
};
