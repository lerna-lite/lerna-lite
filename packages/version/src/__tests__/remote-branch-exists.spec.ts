import { cloneFixtureFactory } from '@lerna-test/helpers';
import { x } from 'tinyexec';
import { expect, test } from 'vitest';

import { remoteBranchExists } from '../lib/remote-branch-exists.js';

const cloneFixture = cloneFixtureFactory(import.meta.dirname);

test('remoteBranchExists', async () => {
  const { cwd } = await cloneFixture('root-manifest-only');

  expect(remoteBranchExists('origin', 'new-branch', { cwd })).toBe(false);

  await x('git', ['checkout', '-b', 'new-branch'], { nodeOptions: { cwd } });
  await x('git', ['push', '-u', 'origin', 'new-branch'], { nodeOptions: { cwd } });

  expect(remoteBranchExists('origin', 'new-branch', { cwd })).toBe(true);
});
