const { version } = require('../package.json');
const { resolve } = require('path');
const { writeFileSync } = require('fs');

writeFileSync(resolve(__dirname, '..', 'lib', 'version.ts'), `export const version = '${version}';\n`);
