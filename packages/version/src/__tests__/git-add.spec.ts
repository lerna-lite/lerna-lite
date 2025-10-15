import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initFixtureFactory } from '@lerna-test/helpers';
import { execa } from 'execa';
import { outputFile, outputJson } from 'fs-extra/esm';
import slash from 'slash';
import { expect, test } from 'vitest';
import { gitAdd } from '../lib/git-add.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

const getStagedFile = async (cwd: string) => execa('git', ['diff', '--cached', '--name-only'], { cwd }).then((result) => slash(result.stdout));

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
