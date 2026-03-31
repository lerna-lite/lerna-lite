import { initFixtureFactory } from '@lerna-test/helpers';
import { expect, test } from 'vitest';

import { getCurrentBranch } from '../lib/get-current-branch.js';

const initFixture = initFixtureFactory(import.meta.dirname);

test('getCurrentBranch', async () => {
  const cwd = await initFixture('root-manifest-only');

  expect(getCurrentBranch({ cwd })).toBe('main');
});

test('getCurrentBranch without commit', async () => {
  const cwd = await initFixture('root-manifest-only', false);

  expect(() => getCurrentBranch({ cwd })).toThrow(/Command failed.*: git rev-parse --abbrev-ref HEAD.*/);
});
