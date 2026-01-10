import { beforeAll, afterAll } from 'vitest';

import { getE2eRoot } from '../e2e-utils/src/index.js';

let E2E_ROOT: string;

// Set up the E2E root directory before all tests
beforeAll(async () => {
  E2E_ROOT = await getE2eRoot();
  process.env.E2E_ROOT = E2E_ROOT;
  console.log(`E2E_ROOT set to: ${E2E_ROOT}`);
});

// Clean up after all tests (optional - you might want to keep for debugging)
afterAll(() => {
  if (process.env.LERNA_E2E_DEBUG !== 'true') {
    // Cleanup could be added here if needed
  }
});
