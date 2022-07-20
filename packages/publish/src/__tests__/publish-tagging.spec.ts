// FIXME: better mock for version command
jest.mock('../../../version/dist/lib/git-push', () =>
  jest.requireActual('../../../version/src/lib/__mocks__/git-push')
);
jest.mock('../../../version/dist/lib/is-anything-committed', () =>
  jest.requireActual('../../../version/src/lib/__mocks__/is-anything-committed')
);
jest.mock('../../../version/dist/lib/is-behind-upstream', () =>
  jest.requireActual('../../../version/src/lib/__mocks__/is-behind-upstream')
);
jest.mock('../../../version/dist/lib/remote-branch-exists', () =>
  jest.requireActual('../../../version/src/lib/__mocks__/remote-branch-exists')
);

// mocked modules of @lerna-lite/core
jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core'), // return the other real methods, below we'll mock only 2 of the methods
  collectUpdates: jest.requireActual('../../../core/src/__mocks__/collect-updates').collectUpdates,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
  getOneTimePassword: () => Promise.resolve('654321'),
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../core/src/__mocks__/prompt').promptTextInput,
}));

// local modules _must_ be explicitly mocked
jest.mock('../lib/get-packages-without-license', () =>
  jest.requireActual('../lib/__mocks__/get-packages-without-license')
);
jest.mock('../lib/verify-npm-package-access', () => jest.requireActual('../lib/__mocks__/verify-npm-package-access'));
jest.mock('../lib/get-npm-username', () => jest.requireActual('../lib/__mocks__/get-npm-username'));
jest.mock('../lib/get-two-factor-auth-required', () =>
  jest.requireActual('../lib/__mocks__/get-two-factor-auth-required')
);
jest.mock('../lib/create-temp-licenses', () => ({ createTempLicenses: jest.fn(() => Promise.resolve()) }));
jest.mock('../lib/remove-temp-licenses', () => ({ removeTempLicenses: jest.fn(() => Promise.resolve()) }));
jest.mock('../lib/pack-directory', () => jest.requireActual('../lib/__mocks__/pack-directory'));
jest.mock('../lib/npm-publish', () => jest.requireActual('../lib/__mocks__/npm-publish'));
jest.mock('../lib/npm-dist-tag', () => jest.requireActual('../lib/__mocks__/npm-dist-tag'));

// also point to the local publish command so that all mocks are properly used even by the command-runner
jest.mock('@lerna-lite/publish', () => jest.requireActual('../publish-command'));

// mocked modules
import { collectUpdates } from '@lerna-lite/core';
import { npmPublish } from '../lib/npm-publish';
import { add, remove } from '../lib/npm-dist-tag';

// helpers
import helpers from '@lerna-test/helpers';
const initFixture = helpers.initFixtureFactory(__dirname);

// test command
import { PublishCommand } from '../index';
import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands';
const lernaPublish = helpers.commandRunner(cliCommands);

const yargParser = require('yargs-parser');

const createArgv = (cwd, ...args) => {
  args.unshift('publish');
  if (args.length > 0 && args[1] && args[1].length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['cwd'] = cwd;
  return argv;
};

test('publish --dist-tag next', async () => {
  const cwd = await initFixture('normal');

  (collectUpdates as any).setUpdated(cwd, 'package-1');

  await new PublishCommand(createArgv(cwd, '--dist-tag', 'next'));

  expect((npmPublish as any).registry.get('package-1')).toBe('next');
  expect(remove).not.toHaveBeenCalled();
});

test('publish --dist-tag nightly --canary', async () => {
  const cwd = await initFixture('normal');

  (collectUpdates as any).setUpdated(cwd, 'package-2');

  await new PublishCommand(createArgv(cwd, '--dist-tag', 'nightly', '--canary'));

  expect((npmPublish as any).registry.get('package-2')).toBe('nightly');
  expect(remove).not.toHaveBeenCalled();
});

test('publish --npm-tag deprecated', async () => {
  const cwd = await initFixture('normal');

  (collectUpdates as any).setUpdated(cwd, 'package-3');

  await lernaPublish(cwd)('--npm-tag', 'deprecated');

  expect((npmPublish as any).registry.get('package-3')).toBe('deprecated');
  expect(remove).not.toHaveBeenCalled();
});

test('publish --temp-tag', async () => {
  const cwd = await initFixture('integration');

  await new PublishCommand(createArgv(cwd, '--temp-tag'));

  expect((npmPublish as any).registry).toMatchInlineSnapshot(`
Map {
  "@integration/package-1" => "lerna-temp",
  "@integration/package-2" => "lerna-temp",
}
`);

  const conf = expect.objectContaining({
    tag: 'latest',
  });
  const cache = expect.objectContaining({
    otp: undefined,
  });

  expect(remove).toHaveBeenCalledWith('@integration/package-1@1.0.1', 'lerna-temp', conf, cache);
  expect(remove).toHaveBeenCalledWith('@integration/package-2@1.0.1', 'lerna-temp', conf, cache);

  expect(add).toHaveBeenCalledWith('@integration/package-1@1.0.1', 'CUSTOM', conf, cache); // <--
  expect(add).toHaveBeenCalledWith('@integration/package-2@1.0.1', 'latest', conf, cache);
});

test('publish --dist-tag beta --temp-tag', async () => {
  const cwd = await initFixture('integration');

  await new PublishCommand(createArgv(cwd, '--dist-tag', 'beta', '--temp-tag'));

  expect((npmPublish as any).registry).toMatchInlineSnapshot(`
Map {
  "@integration/package-1" => "lerna-temp",
  "@integration/package-2" => "lerna-temp",
}
`);

  const conf = expect.objectContaining({
    tag: 'beta',
  });
  const cache = expect.objectContaining({
    otp: undefined,
  });

  expect(add).toHaveBeenCalledWith('@integration/package-1@1.0.1', 'beta', conf, cache); // <--
  expect(add).toHaveBeenCalledWith('@integration/package-2@1.0.1', 'beta', conf, cache);
});

test('publish prerelease --pre-dist-tag beta', async () => {
  const cwd = await initFixture('normal');

  (collectUpdates as any).setUpdated(cwd, 'package-1');

  await new PublishCommand(createArgv(cwd, '--bump', 'prerelease', '--pre-dist-tag', 'beta'));

  expect((npmPublish as any).registry.get('package-1')).toBe('beta');
  expect(remove).not.toHaveBeenCalled();
});

test('publish non-prerelease --pre-dist-tag beta', async () => {
  const cwd = await initFixture('normal');

  (collectUpdates as any).setUpdated(cwd, 'package-1');

  await new PublishCommand(createArgv(cwd, '--pre-dist-tag', 'beta'));

  expect((npmPublish as any).registry.get('package-1')).toBe('latest');
  expect(remove).not.toHaveBeenCalled();
});

test('publish non-prerelease --dist-tag next --pre-dist-tag beta', async () => {
  const cwd = await initFixture('normal');

  (collectUpdates as any).setUpdated(cwd, 'package-1');

  await new PublishCommand(createArgv(cwd, '--dist-tag', 'next', '--pre-dist-tag', 'beta'));

  expect((npmPublish as any).registry.get('package-1')).toBe('next');
  expect(remove).not.toHaveBeenCalled();
});

test('publish --pre-dist-tag beta --temp-tag', async () => {
  const cwd = await initFixture('integration');

  await new PublishCommand(
    createArgv(
      cwd,
      '--bump',
      'prerelease',
      '--dist-tag',
      'next',
      '--preid',
      'beta',
      '--pre-dist-tag',
      'beta',
      '--temp-tag'
    )
  );

  expect((npmPublish as any).registry).toMatchInlineSnapshot(`
Map {
  "@integration/package-1" => "lerna-temp",
  "@integration/package-2" => "lerna-temp",
}
`);

  const conf = expect.objectContaining({
    tag: 'next',
  });
  const cache = expect.objectContaining({
    otp: undefined,
  });

  expect(add).toHaveBeenCalledWith('@integration/package-1@1.0.1-beta.0', 'beta', conf, cache);
  expect(add).toHaveBeenCalledWith('@integration/package-2@1.0.1-beta.0', 'beta', conf, cache);
});
