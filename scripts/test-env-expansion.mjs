#!/usr/bin/env node
import { resolve } from 'node:path';

import { npmConf } from '../packages/core/dist/utils/npm-conf.js';

// Set environment variable
process.env.VERDACCIO_TOKEN = 'my-test-token-12345';
process.env.GITHUB_PKG_TOKEN = 'github-test-token-67890';

console.log('Environment variables set:');
console.log('  VERDACCIO_TOKEN:', process.env.VERDACCIO_TOKEN);
console.log('  GITHUB_PKG_TOKEN:', process.env.GITHUB_PKG_TOKEN);
console.log('');

console.log('Working directory:', process.cwd());
console.log('.npmrc path:', resolve(process.cwd(), '.npmrc'));
console.log('');

// Load npm config with explicit prefix
const config = npmConf({ prefix: process.cwd() });

console.log('Config localPrefix:', config.localPrefix);
console.log('');

console.log('Loaded config values:');
console.log('  registry:', config.get('registry'));
console.log('  //localhost:4873/:_authToken:', config.get('//localhost:4873/:_authToken'));
console.log('  @myorg:registry:', config.get('@myorg:registry'));
console.log('  @myorg:always-auth:', config.get('@myorg:always-auth'));
console.log('');

console.log('All config sources:', Object.keys(config.sources));
console.log('Project config path:', config.sources.project?.path);
console.log('Project config data:', config.sources.project?.data);
console.log('');

// Check if environment variable was expanded
const authToken = config.get('//localhost:4873/:_authToken');
if (authToken === '${VERDACCIO_TOKEN}') {
  console.error('❌ ERROR: Environment variable was NOT expanded!');
  console.error('   Token value is still: ${VERDACCIO_TOKEN}');
  process.exit(1);
} else if (authToken === 'my-test-token-12345') {
  console.log('✅ SUCCESS: Environment variable was properly expanded!');
  console.log('   Token value is:', authToken);
} else {
  console.log('⚠️  Token value is:', authToken);
  if (!authToken) {
    console.log('   .npmrc file may not have been loaded');
  }
}
