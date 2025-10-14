import { expect, test, vi } from 'vitest';

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual('../../../version/src/lib/__mocks__/git-push'));
vi.mock('../../../version/src/lib/is-anything-committed', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-anything-committed'));
vi.mock('../../../version/src/lib/is-behind-upstream', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-behind-upstream'));
vi.mock('../../../version/src/lib/remote-branch-exists', async () => await vi.importActual('../../../version/src/lib/__mocks__/remote-branch-exists'));

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
  getOneTimePassword: () => Promise.resolve('654321'),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
}));

// local modules _must_ be explicitly mocked
vi.mock('../lib/get-packages-without-license', async () => await vi.importActual('../lib/__mocks__/get-packages-without-license'));
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock('../lib/get-two-factor-auth-required', async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required'));
vi.mock('../lib/create-temp-licenses', () => ({ createTempLicenses: vi.fn(() => Promise.resolve()) }));
vi.mock('../lib/remove-temp-licenses', () => ({ removeTempLicenses: vi.fn(() => Promise.resolve()) }));
vi.mock('../lib/pack-directory', async () => await vi.importActual('../lib/__mocks__/pack-directory'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));
vi.mock('../lib/npm-dist-tag', async () => await vi.importActual('../lib/__mocks__/npm-dist-tag'));

// also point to the local publish command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/publish', async () => await vi.importActual('../publish-command'));
vi.mock('@lerna-lite/version', async () => await vi.importActual('../../../version/src/version-command'));

// mocked modules
// helpers
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectUpdates, type PublishCommandOption } from '@lerna-lite/core';

import { add, remove } from '../lib/npm-dist-tag.js';
import { npmPublish } from '../lib/npm-publish.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(__dirname);

// test command
import yargParser from 'yargs-parser';

import { PublishCommand } from '../index.js';

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('publish');
  if (args.length > 0 && args[1] && args[1].length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['cwd'] = cwd;
  return argv as unknown as PublishCommandOption;
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

test('publish --temp-tag', async () => {
  const cwd = await initFixture('integration');

  await new PublishCommand(createArgv(cwd, '--temp-tag'));

  expect((npmPublish as any).registry).toEqual(
    new Map([
      ['@integration/package-1', 'lerna-temp'],
      ['@integration/package-2', 'lerna-temp'],
    ])
  );

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

  expect((npmPublish as any).registry).toEqual(
    new Map([
      ['@integration/package-1', 'lerna-temp'],
      ['@integration/package-2', 'lerna-temp'],
    ])
  );

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

  await new PublishCommand(createArgv(cwd, '--bump', 'prerelease', '--dist-tag', 'next', '--preid', 'beta', '--pre-dist-tag', 'beta', '--temp-tag'));

  expect((npmPublish as any).registry).toEqual(
    new Map([
      ['@integration/package-1', 'lerna-temp'],
      ['@integration/package-2', 'lerna-temp'],
    ])
  );

  const conf = expect.objectContaining({
    tag: 'next',
  });
  const cache = expect.objectContaining({
    otp: undefined,
  });

  expect(add).toHaveBeenCalledWith('@integration/package-1@1.0.1-beta.0', 'beta', conf, cache);
  expect(add).toHaveBeenCalledWith('@integration/package-2@1.0.1-beta.0', 'beta', conf, cache);
});
