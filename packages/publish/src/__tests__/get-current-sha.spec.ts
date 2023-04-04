import { fileURLToPath } from 'url';
import { getCurrentSHA } from '../lib/get-current-sha';
import { initFixtureFactory } from '@lerna-test/helpers';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

test('getCurrentSHA', async () => {
  const cwd = await initFixture('root-manifest-only');

  expect(getCurrentSHA({ cwd })).toMatch(/^[0-9a-f]{40}$/);
});
