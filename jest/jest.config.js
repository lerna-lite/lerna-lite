module.exports = {
  rootDir: '../',
  globals: {
    'ts-jest': {
      diagnostics: false,
      isolatedModules: true,
      tsconfig: '<rootDir>/jest/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.html$'
    },
  },
  clearMocks: true,
  collectCoverage: false,
  collectCoverageFrom: [
    'packages/**/*.+(js|ts)',
    '!**/dist/**',
    '!**/node_modules/**',
    '!**/jest/**',
  ],
  coverageDirectory: '<rootDir>/jest/jest-coverage',
  coveragePathIgnorePatterns: [
    '\\.d\\.ts$',
    '<rootDir>/node_modules/'
  ],
  coverageReporters: [
    'json',
    'lcov',
    'text',
    'html'
  ],
  modulePathIgnorePatterns: ["/__fixtures__/"],
  moduleFileExtensions: [
    'json',
    'js',
    'ts'
  ],
  modulePaths: [
    'src',
    '<rootDir>/node_modules'
  ],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/helpers/silence-logging', '<rootDir>/helpers/set-npm-userconfig'],
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/jest/setup-unit-test-timeout.js'],
  transform: {
    '^.+\\.(ts|html)$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@lerna-lite)/)'
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|js)',
    '**/+(*.)+(spec|test).+(ts|js)'
  ],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],
  // verbose: !!process.env.CI,
  verbose: false,
};
