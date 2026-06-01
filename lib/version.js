import { readFileSync } from 'fs';
import { resolve } from 'path';

export const version = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'package.json'), 'utf8')).version;
