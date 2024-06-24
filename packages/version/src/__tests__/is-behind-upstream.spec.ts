import { expect, test } from 'vitest';
import { execa } from 'execa';
import { cloneFixtureFactory } from '@lerna-test/helpers';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { isBehindUpstream } from '../lib/is-behind-upstream';

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
