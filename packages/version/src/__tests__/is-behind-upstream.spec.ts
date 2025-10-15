import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cloneFixtureFactory } from '@lerna-test/helpers';
import { execa } from 'execa';
import { expect, test } from 'vitest';
import { isBehindUpstream } from '../lib/is-behind-upstream.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cloneFixture = cloneFixtureFactory(__dirname);

test('isBehindUpstream', async () => {
  const { cwd } = await cloneFixture('root-manifest-only');

  expect(isBehindUpstream('origin', 'main', { cwd })).toBe(false);

  await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
  await execa('git', ['push', 'origin', 'main'], { cwd });
  await execa('git', ['reset', '--hard', 'HEAD^'], { cwd });

  expect(isBehindUpstream('origin', 'main', { cwd })).toBe(true);
});
