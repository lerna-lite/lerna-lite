#!/usr/bin/env node

/**
 * Script to test lerna-lite publishing with Verdaccio local registry
 * This helps verify that custom registry authentication works correctly
 */

import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const VERDACCIO_CONFIG = join(PROJECT_ROOT, '.verdaccio', 'config.yaml');
const VERDACCIO_PORT = 4873;
const VERDACCIO_URL = `http://localhost:${VERDACCIO_PORT}`;

console.log('🚀 Starting Verdaccio with project config...\n');
console.log(`Config: ${VERDACCIO_CONFIG}\n`);

// Start Verdaccio
const verdaccio = spawn('npx', ['-y', 'verdaccio', '--config', VERDACCIO_CONFIG], {
  stdio: 'inherit',
  shell: true,
  cwd: PROJECT_ROOT,
});

// Handle cleanup
const cleanup = () => {
  console.log('\n\n🧹 Stopping Verdaccio...');
  verdaccio.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

setTimeout(() => {
  console.log('='.repeat(70));
  console.log('\n✅ Verdaccio should now be running on', VERDACCIO_URL);
  console.log('\nTest publishing with:');
  console.log(`   pnpm run test-verdaccio\n`);
  console.log('Or view the UI:');
  console.log(`   Open ${VERDACCIO_URL} in your browser\n`);
  console.log('='.repeat(70));
  console.log('\nPress Ctrl+C to stop Verdaccio when done.\n');
}, 3000);

verdaccio.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ Verdaccio exited with code ${code}`);
  }
  process.exit(code || 0);
});
