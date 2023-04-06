import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'node',
    globals: true,
    threads: false,
    testTimeout: 60000,
    setupFiles: ['./vitest/vitest-setup.ts', './vitest/silence-logging.ts', './helpers/npm/set-npm-userconfig.ts'],
    watch: false,
    coverage: {
      include: ['packages/**/*.ts'],
      exclude: [...configDefaults.exclude, '**/helpers/**', '**/__fixtures__/**', '**/__mocks__/**', '**/__tests__/**'],
      provider: 'c8',
    },
    snapshotFormat: {
      escapeString: false,
      printBasicPrototype: false,
    },
  },
});
