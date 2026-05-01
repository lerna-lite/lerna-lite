import { join } from 'node:path';

import { outputFile, outputJson, writeJson } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { x } from 'tinyexec';
import { expect, test } from 'vitest';

import { gitCheckout } from '../lib/git-checkout.js';

const initFixture = initFixtureFactory(import.meta.dirname);

// Helper to match Execa's default stripFinalNewline behavior
const strip = (str: string) => str.replace(/\r?\n$/, '');

test('gitCheckout files', async () => {
  const cwd = await initFixture('no-interdependencies');
  const files = ['package-1', 'package-2'].map((name) => join('packages', name, 'package.json'));

  await Promise.all(files.map((fp) => writeJson(join(cwd, fp), { foo: 'bar' })));
  await gitCheckout(files, { granularPathspec: true }, { cwd });

  const { stdout: modified } = await x('git', ['ls-files', '--modified'], { nodeOptions: { cwd } });

  // Apply strip() to remove the trailing newline from Git output
  expect(strip(modified)).toBe('');
});

test('gitCheckout files with .gitignored files', async () => {
  const cwd = await initFixture('no-interdependencies');
  const files = ['package-1', 'package-2', 'package-3'].map((name) => join('packages', name, 'package.json'));

  // simulate a "dynamic", intentionally unversioned package by gitignoring it
  await outputFile(join(cwd, '.gitignore'), 'packages/package-3/*', 'utf8');

  await Promise.all(files.map((fp) => outputJson(join(cwd, fp), { foo: 'bar' })));
  await gitCheckout(files, { granularPathspec: false }, { cwd });

  const { stdout: others } = await x('git', ['ls-files', '--others'], { nodeOptions: { cwd } });

  // Apply strip() here as well
  expect(strip(others)).toBe('packages/package-3/package.json');
});
