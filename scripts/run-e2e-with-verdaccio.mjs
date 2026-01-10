#!/usr/bin/env node

/**
 * Script to run e2e tests with Verdaccio
 * Starts Verdaccio, waits for it to be ready, runs tests, then stops Verdaccio
 */

import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const VERDACCIO_CONFIG = join(PROJECT_ROOT, '.verdaccio', 'config.yaml');
const VERDACCIO_PORT = 4873;
const VERDACCIO_URL = `http://localhost:${VERDACCIO_PORT}`;

let verdaccioProcess = null;

async function waitForVerdaccio(maxAttempts = 30) {
  console.log('⏳ Waiting for Verdaccio to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(VERDACCIO_URL);
      if (response.ok) {
        console.log('✅ Verdaccio is ready!\n');
        return true;
      }
    } catch (error) {
      // Verdaccio not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Verdaccio did not start in time');
}

function startVerdaccio() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Verdaccio...\n');
    
    verdaccioProcess = spawn('npx', ['-y', 'verdaccio', '--config', VERDACCIO_CONFIG], {
      stdio: 'pipe',
      shell: true,
      cwd: PROJECT_ROOT,
    });

    verdaccioProcess.stdout.on('data', (data) => {
      // Suppress most output unless verbose
      if (process.env.VERBOSE) {
        console.log(data.toString());
      }
    });

    verdaccioProcess.stderr.on('data', (data) => {
      // Only show errors
      if (data.toString().includes('error')) {
        console.error(data.toString());
      }
    });

    verdaccioProcess.on('error', reject);
    
    // Give it a moment to start
    setTimeout(() => resolve(), 2000);
  });
}

function stopVerdaccio() {
  if (verdaccioProcess) {
    console.log('\n🧹 Stopping Verdaccio...');
    verdaccioProcess.kill();
    verdaccioProcess = null;
  }
}

function runTests() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Running e2e tests...\n');
    
    const testProcess = spawn('pnpm', ['build'], {
      stdio: 'inherit',
      shell: true,
      cwd: PROJECT_ROOT,
    });

    testProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Build failed with code ${code}`));
        return;
      }
      
      // Now run vitest
      const vitestProcess = spawn('vitest', ['run', '--config', './e2e/vitest.config.ts'], {
        stdio: 'inherit',
        shell: true,
        cwd: PROJECT_ROOT,
      });

      vitestProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Tests failed with code ${code}`));
        } else {
          resolve();
        }
      });
    });
  });
}

async function main() {
  try {
    await startVerdaccio();
    await waitForVerdaccio();
    await runTests();
    console.log('\n✅ All tests completed successfully!');
    stopVerdaccio();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    stopVerdaccio();
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  stopVerdaccio();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopVerdaccio();
  process.exit(0);
});

main();
