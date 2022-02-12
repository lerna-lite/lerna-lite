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
  collectCoverage: false,
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!**/dist/**',
    '!src/assets/**',
    '!examples/webpack-demo-vanilla-bundle/**',
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
  setupFilesAfterEnv: ['jest-extended/all'],
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
};
