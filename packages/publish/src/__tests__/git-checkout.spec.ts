import { join } from 'node:path';

import { initFixtureFactory } from '@lerna-test/helpers';
import { execa } from 'execa';
import { outputFile, outputJson, writeJson } from 'fs-extra/esm';
import { expect, test } from 'vitest';

import { gitCheckout } from '../lib/git-checkout.js';

const initFixture = initFixtureFactory(import.meta.dirname);

test('gitCheckout files', async () => {
  const cwd = await initFixture('no-interdependencies');
  const files = ['package-1', 'package-2'].map((name) => join('packages', name, 'package.json'));

  await Promise.all(files.map((fp) => writeJson(join(cwd, fp), { foo: 'bar' })));
  await gitCheckout(files, { granularPathspec: true }, { cwd });

  const { stdout: modified } = await execa('git', ['ls-files', '--modified'], { cwd });
  expect(modified).toBe('');
});

test('gitCheckout files with .gitignored files', async () => {
  const cwd = await initFixture('no-interdependencies');
  const files = ['package-1', 'package-2', 'package-3'].map((name) => join('packages', name, 'package.json'));

  // simulate a "dynamic", intentionally unversioned package by gitignoring it
  await outputFile(join(cwd, '.gitignore'), 'packages/package-3/*', 'utf8');

  await Promise.all(files.map((fp) => outputJson(join(cwd, fp), { foo: 'bar' })));
  await gitCheckout(files, { granularPathspec: false }, { cwd });

  const { stdout: modified } = await execa('git', ['ls-files', '--others'], { cwd });
  expect(modified).toBe('packages/package-3/package.json');
});
