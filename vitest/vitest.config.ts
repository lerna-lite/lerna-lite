import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    cache: false,
    clearMocks: true,
    deps: {
      interopDefault: false,
    },
    environment: 'node',
    pool: 'forks',
    testTimeout: 60000,
    setupFiles: ['./vitest/silence-logging.ts', './helpers/npm/set-npm-userconfig.ts'],
    watch: false,
    coverage: {
      include: ['packages/**/*.ts'],
      exclude: [
        ...configDefaults.exclude,
        '**/dist/**',
        '**/helpers/**',
        '**/models/**',
        '**/__fixtures__/**',
        '**/__helpers__/**',
        '**/__mocks__/**',
        '**/__tests__/**',
        '**/index.ts',
        '**/interface{s}.ts',
        '**/model{s}.ts',
      ],
      provider: 'v8',
    },
    env: {
      NO_COLOR: 'true',
    },
  },
});
