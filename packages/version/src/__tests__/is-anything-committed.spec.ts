import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { execa } from 'execa';
import { expect, test, vi } from 'vitest';
import { isAnythingCommitted } from '../lib/is-anything-committed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFixture = initFixtureFactory(__dirname);

vi.mock('@lerna-lite/core', async () => {
  const { execSync } = await vi.importActual<any>('@lerna-lite/core');
  return {
    __esModule: true,
    execSync: vi.fn(execSync),
  };
});

test('isAnythingCommitted', async () => {
  const cwd = await initFixture('root-manifest-only');

  expect(isAnythingCommitted({ cwd })).toBe(true);
});

test('dry-run of isAnythingCommitted', async () => {
  const cwd = await initFixture('root-manifest-only');

  expect(isAnythingCommitted({ cwd }, true)).toBe(true);
  expect(execSync).toHaveBeenCalledWith('git', ['rev-list', '--count', '--all', '--max-count=1'], { cwd: expect.any(String) }, true);
});

test('isAnythingCommitted without and with a commit', async () => {
  const cwd = await initFixture('root-manifest-only', false);

  expect(isAnythingCommitted({ cwd })).toBe(false);

  await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });

  expect(isAnythingCommitted({ cwd })).toBe(true);
});
