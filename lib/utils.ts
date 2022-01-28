import { IncomingMessage } from 'http';
import { resolve } from 'path';
import fs from 'fs';

export const isEmpty = (value: unknown) => {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
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

// Node.js v12 doesn't support the `throwIfNoEntry`
// Once we drop v12, let's remove this function and use `throwIfNoEntry`
const checkIfPathExists = (path: string) => {
  try {
    let stat = fs.statSync(path);

    return stat;
  } catch {
    return undefined;
  }
};

export const findPackageJson = (dirName: string): string => {
  const path = resolve(dirName, 'package.json');

  if (checkIfPathExists(path) == null) {
    const parentPath = resolve(dirName, '..');

    if (checkIfPathExists(parentPath) != null) {
      return findPackageJson(parentPath);
    }

    return '';
  }

  return fs.readFileSync(path).toString();
};
