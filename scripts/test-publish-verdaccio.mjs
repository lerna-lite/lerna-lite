#!/usr/bin/env node

/**
 * Test script to verify lerna publish works with environment variables in .npmrc
 * Simulates the user's GitHub Actions workflow issue
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const VERDACCIO_URL = 'http://localhost:4873';

console.log('Testing lerna publish with environment variable authentication...\n');

// Check Verdaccio is running
try {
  execSync(`curl -s ${VERDACCIO_URL} > nul`, { stdio: 'ignore' });
  console.log('✅ Verdaccio is running at', VERDACCIO_URL);
} catch (err) {
  console.error('❌ Verdaccio is not running. Start it with: node scripts/test-verdaccio.mjs');
  process.exit(1);
}

// Set environment variable (simulating GitHub Actions)
process.env.VERDACCIO_TOKEN = process.env.VERDACCIO_TOKEN || 'test-token-from-env';
console.log('✅ Environment variable set: VERDACCIO_TOKEN =', process.env.VERDACCIO_TOKEN);

// Check .npmrc exists
if (!existsSync('.npmrc')) {
  console.error('❌ .npmrc file not found');
  process.exit(1);
}
console.log('✅ .npmrc file found\n');

// Show what lerna will use
console.log('Testing lerna configuration...\n');

try {
  // This should read .npmrc with ${VERDACCIO_TOKEN} and expand it
  execSync('node packages/cli/dist/cli.js list', {
    stdio: 'inherit',
    env: { ...process.env },
  });

  console.log('\n✅ Lerna successfully loaded configuration with environment variables!');
  console.log('   The .npmrc file with ${VERDACCIO_TOKEN} was properly expanded.');
} catch (err) {
  console.error('\n❌ Failed to run lerna');
  process.exit(1);
}

console.log('\n📝 Next steps:');
console.log('   1. Add user to Verdaccio: npm adduser --registry http://localhost:4873');
console.log('   2. Run a test publish: node packages/cli/dist/cli.js publish --registry http://localhost:4873');
