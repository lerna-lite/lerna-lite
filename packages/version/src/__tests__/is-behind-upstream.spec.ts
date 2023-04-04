import { execa } from 'execa';
import { isBehindUpstream } from '../lib/is-behind-upstream';
import { cloneFixtureFactory } from '@lerna-test/helpers';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cloneFixture = cloneFixtureFactory(__dirname);

test('isBehindUpstream', async () => {
  const { cwd } = await cloneFixture('root-manifest-only');

  expect(isBehindUpstream('origin', 'main', { cwd })).toBe(false);

  await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
  await execa('git', ['push', 'origin', 'main'], { cwd });
  await execa('git', ['reset', '--hard', 'HEAD^'], { cwd });

  expect(isBehindUpstream('origin', 'main', { cwd })).toBe(true);
});
