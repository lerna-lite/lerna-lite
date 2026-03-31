import { initFixtureFactory } from '@lerna-test/helpers';
import { expect, test } from 'vitest';

import { getCurrentSHA } from '../lib/get-current-sha.js';

const initFixture = initFixtureFactory(import.meta.dirname);

test('getCurrentSHA', async () => {
  const cwd = await initFixture('root-manifest-only');

  expect(getCurrentSHA({ cwd })).toMatch(/^[0-9a-f]{40}$/);
});
