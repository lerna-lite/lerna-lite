// oxlint-disable-next-line extensions
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
    // Exclude e2e tests from unit test runs
    exclude: [...configDefaults.exclude, 'e2e/**', 'e2e-utils/**'],
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
        '**/defaults.ts',
        '**/index.ts',
        '**/interfaces.ts',
        '**/models.ts',
        '**/types.ts',
      ],
      provider: 'v8',
    },
  },
});
