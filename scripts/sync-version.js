const { version } = require('../package.json');
const { resolve } = require('path');
const { writeFileSync } = require('fs');

// The marker lets release-please bump this file in its release PR.
writeFileSync(
  resolve(__dirname, '..', 'lib', 'version.ts'),
  `export const version = '${version}'; // x-release-please-version\n`,
);
