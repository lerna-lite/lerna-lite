import { cloneFixtureFactory } from '@lerna-test/helpers';
import { x } from 'tinyexec';
import { expect, test } from 'vitest';

import { isBehindUpstream } from '../lib/is-behind-upstream.js';

const cloneFixture = cloneFixtureFactory(import.meta.dirname);

test('isBehindUpstream', async () => {
  const { cwd } = await cloneFixture('root-manifest-only');

  expect(isBehindUpstream('origin', 'main', { cwd })).toBe(false);

  await x('git', ['commit', '--allow-empty', '-m', 'change'], { nodeOptions: { cwd } });
  await x('git', ['push', 'origin', 'main'], { nodeOptions: { cwd } });
  await x('git', ['reset', '--hard', 'HEAD^'], { nodeOptions: { cwd } });

  expect(isBehindUpstream('origin', 'main', { cwd })).toBe(true);
});
