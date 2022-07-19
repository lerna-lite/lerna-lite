import execa from 'execa';
import { isBehindUpstream } from '../lib/is-behind-upstream';
import helpers from '@lerna-test/helpers';
const cloneFixture = helpers.cloneFixtureFactory(__dirname);

test('isBehindUpstream', async () => {
  const { cwd } = await cloneFixture('root-manifest-only');

  expect(isBehindUpstream('origin', 'main', { cwd })).toBe(false);

  await execa('git', ['commit', '--allow-empty', '-m', 'change'], { cwd });
  await execa('git', ['push', 'origin', 'main'], { cwd });
  await execa('git', ['reset', '--hard', 'HEAD^'], { cwd });

  expect(isBehindUpstream('origin', 'main', { cwd })).toBe(true);
});
