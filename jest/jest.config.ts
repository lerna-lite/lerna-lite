import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  rootDir: '../',
  clearMocks: true,
  collectCoverage: !!(process.env.CI && process.env.LERNA_OS_TYPE !== 'windows'),
  collectCoverageFrom: ['packages/**/*.+(js|ts)', '!**/dist/**', '!**/node_modules/**', '!**/jest/**'],
  coverageDirectory: '<rootDir>/jest/jest-coverage',
  coveragePathIgnorePatterns: ['\\.d\\.ts$', '<rootDir>/node_modules/'],
  coverageReporters: ['json', 'lcov', 'text', 'html'],
  modulePathIgnorePatterns: ['/__fixtures__/'],
  moduleFileExtensions: ['json', 'js', 'ts'],
  modulePaths: ['src', '<rootDir>/node_modules'],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/jest/silence-logging.ts', '<rootDir>/helpers/npm/set-npm-userconfig.ts'],
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/jest/setup-unit-test-timeout.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: false,
        isolatedModules: true,
        tsconfig: '<rootDir>/jest/tsconfig.spec.json',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(@lerna-lite)/)'],
  testMatch: ['**/__tests__/**/*.+(ts|js)', '**/+(*.)+(spec|test).+(ts|js)'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  // verbose: !!process.env.CI,
  verbose: false,
};

export default config;
