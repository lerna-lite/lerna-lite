import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // E2E tests should run sequentially to avoid conflicts
    pool: 'forks',
    // Vitest 4: singleFork is now a top-level option
    singleFork: true,
    // Longer timeout for E2E tests that involve npm operations
    testTimeout: 120000,
    hookTimeout: 120000,
    // Don't watch in E2E tests
    watch: false,
    // Retry flaky E2E tests
    retry: process.env.CI ? 2 : 0,
    // Setup files
    setupFiles: ['./e2e/setup.ts'],
    // Include pattern for E2E tests only
    include: ['e2e/**/*.spec.ts'],
    // Global test configuration
    globals: true,
  },
});
