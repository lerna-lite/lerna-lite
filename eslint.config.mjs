import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import n from 'eslint-plugin-n';
import tsParser from '@typescript-eslint/parser';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '*.css',
      '*.scss',
      '*.html',
      '*.png',
      '*.json',
      '*.js',
      '*.d.ts',
      '*.map',
      '*.md',
      '*.zip',
      '*.test.js',
      '*.test.ts',
      '*.spec.js',
      '*.spec.ts',
      '**/**/*.json',
      '**/**/*.js',
      '**/__tests__/*.*',
      '**/dist/**/*.*',
      '**/__helpers__/**/*.*',
      '**/__mocks__/**/*.*',
      '**/__tests__/**/*.*',
      '**/packages/**/*.js',
    ],
  },
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      n,
    },
    files: ['**/*.ts'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.base.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      node: {
        tryExtensions: ['.js', '.json', '.node', '.ts', '.d.ts'],
        resolvePaths: ['node_modules/@types'],
      },
    },
    rules: {
      'class-methods-use-this': 'off',
      'consistent-return': 'off',
      curly: ['error', 'all'],
      'default-param-last': 'off',
      'dot-notation': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
      'import/order': 'off',
      'n/no-missing-require': 'off',
      'no-async-promise-executor': 'off',
      'no-param-reassign': 'off',
      'no-restricted-syntax': 'off',
      'no-underscore-dangle': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-case-declarations': 'off',
      'no-use-before-define': [
        'error',
        {
          functions: false,
          classes: false,
        },
      ],
      'n/no-extraneous-require': 'off',
      'n/no-unpublished-require': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'prefer-destructuring': 'off',
      'prefer-object-spread': 'off',
      strict: 'off',
      'max-len': 'off',
      'arrow-body-style': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  }
);
