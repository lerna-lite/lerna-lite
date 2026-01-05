#!/usr/bin/env node

/**
 * Script to test lerna-lite publishing with Verdaccio local registry
 * This helps verify that custom registry authentication works correctly
 */

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const VERDACCIO_PORT = 4873;
const VERDACCIO_URL = `http://localhost:${VERDACCIO_PORT}`;
const TEST_DIR = join(tmpdir(), 'lerna-verdaccio-test');

console.log('🚀 Setting up Verdaccio for testing...\n');

// Create test directory
try {
  rmSync(TEST_DIR, { recursive: true, force: true });
} catch (e) {
  // Ignore if doesn't exist
}
mkdirSync(TEST_DIR, { recursive: true });

// Create Verdaccio config
const verdaccioConfig = `
storage: ${TEST_DIR}/storage
auth:
  htpasswd:
    file: ${TEST_DIR}/htpasswd
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@*/*':
    access: $all
    publish: $authenticated
  '**':
    access: $all
    publish: $authenticated
    proxy: npmjs
logs:
  - { type: stdout, format: pretty, level: info }
`;

const configPath = join(TEST_DIR, 'config.yaml');
writeFileSync(configPath, verdaccioConfig);

console.log(`📝 Config created at: ${configPath}`);
console.log(`📦 Storage location: ${TEST_DIR}/storage\n`);

// Start Verdaccio
console.log(`🌐 Starting Verdaccio on ${VERDACCIO_URL}...`);
console.log(`⏳ This may prompt to install verdaccio - please confirm with 'y'\n`);

const verdaccio = spawn('npx', ['-y', 'verdaccio', '-c', configPath], {
  stdio: 'inherit',
  shell: true,
});

// Handle cleanup
const cleanup = () => {
  console.log('\n\n🧹 Cleaning up...');
  verdaccio.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Wait a bit for Verdaccio to start, then provide instructions
setTimeout(() => {
  console.log('\n' + '='.repeat(70));
  console.log('✅ Verdaccio is running!');
  console.log('='.repeat(70));
  console.log('\n📋 Next steps:\n');
  console.log('1. Open a NEW terminal window');
  console.log('2. Create a test user:');
  console.log(`   npm adduser --registry ${VERDACCIO_URL}`);
  console.log('   (Use any credentials, e.g., test/test/test@example.com)\n');
  console.log('3. Create a .npmrc file in your project with:');
  console.log(`   registry=${VERDACCIO_URL}/`);
  console.log(`   //${VERDACCIO_URL.replace('http://', '')}/:_authToken=YOUR_TOKEN_HERE\n`);
  console.log('4. Test publishing:');
  console.log(`   lerna publish --registry ${VERDACCIO_URL} --canary --no-git-tag-version --no-push --yes\n`);
  console.log('5. View published packages:');
  console.log(`   Open ${VERDACCIO_URL} in your browser\n`);
  console.log('='.repeat(70));
  console.log('\nPress Ctrl+C to stop Verdaccio when done.\n');
}, 3000);

verdaccio.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ Verdaccio exited with code ${code}`);
    console.log('\nTrying to install verdaccio...');
    const install = spawn('npm', ['install', '-g', 'verdaccio'], {
      stdio: 'inherit',
      shell: true,
    });
    install.on('exit', (installCode) => {
      if (installCode === 0) {
        console.log('\n✅ Verdaccio installed. Please run this script again.');
      }
      process.exit(installCode || 0);
    });
  }
});
