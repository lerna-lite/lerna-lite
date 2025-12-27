import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cloneFixtureFactory } from '@lerna-test/helpers';
import { execa } from 'execa';
import { expect, test } from 'vitest';

import { remoteBranchExists } from '../lib/remote-branch-exists.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cloneFixture = cloneFixtureFactory(__dirname);

test('remoteBranchExists', async () => {
  const { cwd } = await cloneFixture('root-manifest-only');

  expect(remoteBranchExists('origin', 'new-branch', { cwd })).toBe(false);

  await execa('git', ['checkout', '-b', 'new-branch'], { cwd });
  await execa('git', ['push', '-u', 'origin', 'new-branch'], { cwd });

  expect(remoteBranchExists('origin', 'new-branch', { cwd })).toBe(true);
});