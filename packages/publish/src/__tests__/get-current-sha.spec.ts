import { expect, test } from 'vitest';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getCurrentSHA } from '../lib/get-current-sha';
import { initFixtureFactory } from '@lerna-test/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

test('getCurrentSHA', async () => {
  const cwd = await initFixture('root-manifest-only');

  expect(getCurrentSHA({ cwd })).toMatch(/^[0-9a-f]{40}$/);
});
