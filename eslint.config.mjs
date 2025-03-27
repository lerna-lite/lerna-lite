import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import n from 'eslint-plugin-n';
import eslintPrettier from 'eslint-config-prettier';
import vitest from '@vitest/eslint-plugin';

export default tseslint.config(
  {
    ignores: ['**/*.{js,mjs,json,md}', '**/*/*.d.ts', '**/dist/*', '**/__helpers__/**/*.*', '**/__mocks__/**/*.*'],
  },
  {
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: { n },
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.base.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'arrow-body-style': 'off',
      'class-methods-use-this': 'off',
      'consistent-return': 'off',
      curly: ['error', 'all'],
      'default-param-last': 'off',
      'dot-notation': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
      'import/order': 'off',
      'max-len': 'off',
      'n/file-extension-in-import': ['error', 'always'],
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
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
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
  },
  {
    files: ['**/*.{spec,test}.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      // ...vitest.configs.all.rules, // worth testing from time to time…

      // Additional rules below taken from `vitest.configs.all.rules`
      'vitest/consistent-test-it': 0,
      'vitest/no-hooks': 0, // when testing `vitest.configs.all.rules`
      'vitest/no-test-return-statement': 1,
      'vitest/prefer-expect-assertions': 0, // when testing `vitest.configs.all.rules`
      'vitest/prefer-todo': 1,
      'vitest/require-to-throw-message': 1,
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },
  eslintPrettier
);
