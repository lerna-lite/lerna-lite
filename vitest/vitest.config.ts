import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cache: false,
    clearMocks: true,
    environment: 'node',
    globals: true,
    threads: false,
    testTimeout: 60000,
    setupFiles: ['./vitest/vitest-setup.ts', './vitest/silence-logging.ts', './helpers/npm/set-npm-userconfig.ts'],
    watch: false,
    coverage: {
      include: ['packages/**/*.ts'],
      exclude: [
        ...configDefaults.exclude,
        '**/helpers/**',
        '**/models/**',
        '**/__fixtures__/**',
        '**/__helpers__/**',
        '**/__mocks__/**',
        '**/__tests__/**',
      ],
      provider: 'c8',
    },
    snapshotFormat: {
      escapeString: true,
    },
    onConsoleLog(log, _type) {
      if (/* _type === 'stderr' && */ log.includes(`Could not find 'nx' module`) || log.includes('lerna-lite')) {
        return false;
      }
    },
  },
});
