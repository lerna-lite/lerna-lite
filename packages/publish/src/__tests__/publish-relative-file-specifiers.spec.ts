import { outputFile } from 'fs-extra/esm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import * as writePkg from 'write-package';
import yargParser from 'yargs-parser';

import type { PublishCommandOption } from '@lerna-lite/core';

import { commandRunner, gitAdd, gitCommit, gitTag, initFixtureFactory } from '@lerna-test/helpers';

import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands.js';
import { PublishCommand } from '../index.js';

vi.mock('write-package', async () => await vi.importActual('../../../version/src/lib/__mocks__/write-package'));

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual('../../../version/src/lib/__mocks__/git-push'));
vi.mock(
  '../../../version/src/lib/is-anything-committed',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/is-anything-committed')
);
vi.mock(
  '../../../version/src/lib/is-behind-upstream',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/is-behind-upstream')
);
vi.mock(
  '../../../version/src/lib/remote-branch-exists',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/remote-branch-exists')
);

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
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

// also point to the local publish command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/publish', async () => await vi.importActual('../publish-command'));
vi.mock('@lerna-lite/version', async () => await vi.importActual('../../../version/src/version-command'));

// local modules _must_ be explicitly mocked
vi.mock(
  '../lib/get-packages-without-license',
  async () => await vi.importActual('../lib/__mocks__/get-packages-without-license')
);
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock(
  '../lib/get-two-factor-auth-required',
  async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required')
);
vi.mock('../lib/pack-directory', async () => await vi.importActual('../lib/__mocks__/pack-directory'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFixture = initFixtureFactory(__dirname);

const lernaPublish = commandRunner(cliCommands);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('publish');
  if (args.length > 0 && args[1] && args[1].length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as PublishCommandOption;
};

describe("relative 'file:' specifiers", () => {
  const setupChanges = async (cwd: string, pkgRoot = 'packages') => {
    await outputFile(join(cwd, `${pkgRoot}/package-1/hello.js`), 'world');
    await gitAdd(cwd, '.');
    await gitCommit(cwd, 'setup');
  };

  it('overwrites relative link with local version before npm publish but after git commit', async () => {
    const cwd = await initFixture('relative-file-specs');

    await gitTag(cwd, 'v1.0.0');
    await setupChanges(cwd);
    await new PublishCommand(createArgv(cwd, '--bump', 'major', '--yes'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '2.0.0',
      'package-2': '2.0.0',
      'package-3': '2.0.0',
      'package-4': '2.0.0',
      'package-5': '2.0.0',
      'package-6': '2.0.0',
      'package-7': '2.0.0',
    });

    // notably missing is package-1, which has no relative file: dependencies
    expect((writePkg as any).updatedManifest('package-2').dependencies).toMatchObject({
      'package-1': '^2.0.0',
    });
    expect((writePkg as any).updatedManifest('package-3').dependencies).toMatchObject({
      'package-2': '^2.0.0',
    });
    expect((writePkg as any).updatedManifest('package-4').optionalDependencies).toMatchObject({
      'package-3': '^2.0.0',
    });
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      'package-4': '^2.0.0',
      // all fixed versions are bumped when major
      'package-6': '^2.0.0',
    });
    // private packages do not need local version resolution
    expect((writePkg as any).updatedManifest('package-7').dependencies).toMatchObject({
      'package-1': 'file:../package-1',
    });
  });

  // oxlint-disable-next-line no-disabled-tests
  it.skip('falls back to existing relative version when it is not updated', async () => {
    const cwd = await initFixture('relative-independent');

    await gitTag(cwd, 'package-1@1.0.0');
    await setupChanges(cwd);
    await lernaPublish(cwd)('minor', '--yes');

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '1.1.0',
      'package-2': '2.1.0',
      'package-3': '3.1.0',
      'package-4': '4.1.0',
      'package-5': '5.1.0',
    });

    // package-4 was updated, but package-6 was not
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      'package-4': '^4.1.0',
      'package-6': '^6.0.0',
    });
  });

  // oxlint-disable-next-line no-disabled-tests
  it.skip('respects --exact', async () => {
    const cwd = await initFixture('relative-independent');

    await gitTag(cwd, 'package-1@1.0.0');
    await setupChanges(cwd);
    await lernaPublish(cwd)('patch', '--yes', '--exact');

    // package-4 was updated, but package-6 was not
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      'package-4': '4.0.1',
      'package-6': '6.0.0',
    });
  });

  it('works around npm-incompatible link: specifiers', async () => {
    const cwd = await initFixture('yarn-link-spec');

    await gitTag(cwd, 'v1.0.0');
    await setupChanges(cwd, 'workspaces');
    await lernaPublish(cwd)('major', '--yes');

    expect((writePkg as any).updatedManifest('package-2').dependencies).toMatchObject({
      'package-1': '^2.0.0',
    });
  });
});
