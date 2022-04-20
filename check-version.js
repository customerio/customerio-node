import { version as hardCodedVersion } from './lib/version';
import packageJson from './package.json';

if (packageJson.version !== hardCodedVersion) {
  console.error(`You need to update \`./lib/version.ts\` to match the version in package.json before committing!

package.json version: \x1B[1;32m${packageJson.version}\x1B[m
hard coded version:   \x1B[1;31m${hardCodedVersion}\x1B[m`);
  process.exit(1);
}

process.exit(0);
