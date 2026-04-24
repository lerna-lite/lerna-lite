import { join } from 'node:path';

import { slash } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { outputFile, outputJson } from 'fs-extra/esm';
import { x } from 'tinyexec';
import { expect, test } from 'vitest';

import { gitAdd } from '../lib/git-add.js';

const initFixture = initFixtureFactory(import.meta.dirname);

// Helper to match Execa's default stripFinalNewline behavior
const strip = (str: string) => str.replace(/\r?\n$/, '');

const getStagedFile = async (cwd: string) =>
  x('git', ['diff', '--cached', '--name-only'], { nodeOptions: { cwd } }).then((result) => slash(strip(result.stdout)));

test('relative files', async () => {
  const cwd = await initFixture('root-manifest-only');
  const file = join('packages', 'pkg-1', 'index.js');

  await outputFile(join(cwd, file), 'hello');
  await gitAdd([file], { granularPathspec: true }, { cwd });

  await expect(getStagedFile(cwd)).resolves.toBe('packages/pkg-1/index.js');
});

test('absolute files', async () => {
  const cwd = await initFixture('root-manifest-only');
  const file = join(cwd, 'packages', 'pkg-2', 'index.js');

  await outputFile(file, 'hello');
  await gitAdd([file], { granularPathspec: true }, { cwd });

  await expect(getStagedFile(cwd)).resolves.toBe('packages/pkg-2/index.js');
});

test('.gitignore', async () => {
  const cwd = await initFixture('root-manifest-only');
  const file3 = join(cwd, 'packages/version-3/package.json');
  const file4 = join(cwd, 'packages/dynamic-4/package.json');

  await Promise.all([
    // a 'dynamic' package is intentionally unversioned, yet still published
    outputJson(file3, { three: true }),
    outputJson(file4, { four: true }),
  ]);

  await gitAdd([file3, file4], { granularPathspec: false }, { cwd });

  await expect(getStagedFile(cwd)).resolves.toBe('packages/version-3/package.json');
});

test('.gitignore without naming files', async () => {
  const cwd = await initFixture('root-manifest-only');
  const file5 = join(cwd, 'packages/version-5/package.json');
  const file6 = join(cwd, 'packages/dynamic-6/package.json');

  await Promise.all([
    // a 'dynamic' package is intentionally unversioned, yet still published
    outputJson(file5, { five: true }),
    outputJson(file6, { six: true }),
  ]);

  await gitAdd([], { granularPathspec: false }, { cwd });

  await expect(getStagedFile(cwd)).resolves.toBe('packages/version-5/package.json');
});
