import { describe, expect, it, vi } from 'vitest';

vi.mock('write-package', async () => await vi.importActual('../../../version/src/lib/__mocks__/write-package'));

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual<any>('../../../version/src/lib/__mocks__/git-push'));
vi.mock('../../../version/src/lib/is-anything-committed', async () => await vi.importActual<any>('../../../version/src/lib/__mocks__/is-anything-committed'));
vi.mock('../../../version/src/lib/is-behind-upstream', async () => await vi.importActual<any>('../../../version/src/lib/__mocks__/is-behind-upstream'));
vi.mock('../../../version/src/lib/remote-branch-exists', async () => await vi.importActual<any>('../../../version/src/lib/__mocks__/remote-branch-exists'));

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
vi.mock('@lerna-lite/publish', async () => await vi.importActual<any>('../publish-command'));
vi.mock('@lerna-lite/version', async () => await vi.importActual('../../../version/src/version-command'));

// local modules _must_ be explicitly mocked
vi.mock('../lib/get-packages-without-license', async () => await vi.importActual<any>('../lib/__mocks__/get-packages-without-license'));
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual<any>('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual<any>('../lib/__mocks__/get-npm-username'));
vi.mock('../lib/get-two-factor-auth-required', async () => await vi.importActual<any>('../lib/__mocks__/get-two-factor-auth-required'));
vi.mock('../lib/pack-directory', async () => await vi.importActual<any>('../lib/__mocks__/pack-directory'));
vi.mock('../lib/npm-publish', async () => await vi.importActual<any>('../lib/__mocks__/npm-publish'));

import { outputFile } from 'fs-extra/esm';
import { dirname, join } from 'node:path';
import npmlog from 'npmlog';

// mocked modules
import writePkg from 'write-package';

// helpers
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { gitAdd } from '@lerna-test/helpers';
import { gitTag } from '@lerna-test/helpers';
import { gitCommit } from '@lerna-test/helpers';
import { initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(__dirname);

// test command
import { PublishCommand } from '../index';

import yargParser from 'yargs-parser';
import { PublishCommandOption } from '@lerna-lite/core';

const createArgv = (cwd, ...args) => {
  args.unshift('publish');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as PublishCommandOption;
};

describe("workspace protocol 'workspace:' specifiers", () => {
  const setupChanges = async (cwd, pkgRoot = 'packages') => {
    await outputFile(join(cwd, `${pkgRoot}/package-1/hello.js`), 'world');
    await gitAdd(cwd, '.');
    await gitCommit(cwd, 'setup');
  };

  it('overwrites workspace protocol with local minor bumped version before npm publish but after git commit & also expect bump peerDependencies when allowPeerDependenciesUpdate flag is enabled', async () => {
    const cwd = await initFixture('workspace-protocol-specs');

    await gitTag(cwd, 'v1.0.0');
    await setupChanges(cwd);
    await new PublishCommand(createArgv(cwd, '--bump', 'minor', '--yes', '--allow-peer-dependencies-update'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '1.1.0',
      'package-2': '1.1.0',
      'package-3': '1.1.0',
      'package-4': '1.1.0',
      'package-5': '1.1.0',
      'package-6': '1.1.0',
      'package-7': '1.1.0',
    });

    // notably missing is package-1, which has no relative file: dependencies
    expect((writePkg as any).updatedManifest('package-2').dependencies).toMatchObject({
      'package-1': '1.1.0', // workspace:*
    });
    expect((writePkg as any).updatedManifest('package-2').peerDependencies).toMatchObject({
      // peer deps should be bumped to a fixed minor version
      'package-1': '1.1.0', // workspace:*
    });
    expect((writePkg as any).updatedManifest('package-3').dependencies).toMatchObject({
      'package-2': '^1.1.0', // workspace:^
    });
    expect((writePkg as any).updatedManifest('package-3').peerDependencies).toMatchObject({
      // peer deps should be bumped to a minor with ^ spec
      'package-2': '^1.1.0', // workspace:^
    });
    expect((writePkg as any).updatedManifest('package-4').optionalDependencies).toMatchObject({
      'package-3': '~1.1.0', // workspace:~
    });
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      // all fixed versions are bumped when minor
      'package-4': '^1.1.0', // workspace:^1.0.0
      'package-6': '~1.1.0', // workspace:~1.0.0
    });
    expect((writePkg as any).updatedManifest('package-5').peerDependencies).toMatchObject({
      // peer dependencies without operator range will be bumped with the flag enabled
      'package-4': '>=1.0.0', // workspace:>=1.0.0, range shouldn't be bumped
      'package-6': '~1.1.0', // workspace:~1.0.0
    });
    expect((writePkg as any).updatedManifest('package-6').dependencies).toMatchObject({
      'package-1': '>=1.0.0', // workspace:>=1.0.0, range shouldn't be bumped
    });
    expect((writePkg as any).updatedManifest('package-6').peerDependencies).toMatchObject({
      'package-1': '>=1.0.0', // workspace:>=1.0.0
    });
    // private packages do not need local version resolution
    expect((writePkg as any).updatedManifest('package-7').dependencies).toMatchObject({
      'package-1': '^1.1.0',
    });
    expect((writePkg as any).updatedManifest('package-7').peerDependencies).toMatchObject({
      'package-2': '^1.1.0',
      'package-3': '>=1.0.0',
    });
  });

  it('overwrites workspace protocol with local major bumped version before npm publish but after git commit', async () => {
    const cwd = await initFixture('workspace-protocol-specs');

    await gitTag(cwd, 'v1.0.0');
    await setupChanges(cwd);
    await new PublishCommand(createArgv(cwd, '--bump', 'major', '--yes', '--allow-peer-dependencies-update'));

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
      'package-1': '2.0.0', // workspace:*
    });
    expect((writePkg as any).updatedManifest('package-3').dependencies).toMatchObject({
      'package-2': '^2.0.0', // workspace:^
    });
    expect((writePkg as any).updatedManifest('package-3').peerDependencies).toMatchObject({
      'package-2': '^2.0.0', // workspace:^
    });
    expect((writePkg as any).updatedManifest('package-4').optionalDependencies).toMatchObject({
      'package-3': '~2.0.0', // workspace:~
    });
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      // all fixed versions are bumped when major
      'package-4': '^2.0.0', // workspace:^1.0.0
      'package-6': '~2.0.0', // workspace:~1.0.0
    });
    expect((writePkg as any).updatedManifest('package-5').peerDependencies).toMatchObject({
      // peer dependencies will not be bumped by default without a flag
      'package-4': '>=1.0.0', // workspace:>=1.0.0, range shouldn't be bumped
      'package-6': '~2.0.0', // workspace:~1.0.0
    });
    expect((writePkg as any).updatedManifest('package-6').dependencies).toMatchObject({
      'package-1': '>=1.0.0', // workspace:>=1.0.0, range shouldn't be bumped
    });
    expect((writePkg as any).updatedManifest('package-6').peerDependencies).toMatchObject({
      'package-1': '>=1.0.0', // workspace:>=1.0.0, not bumped without a flag
    });
    // private packages do not need local version resolution
    expect((writePkg as any).updatedManifest('package-7').dependencies).toMatchObject({
      'package-1': '^2.0.0', // ^1.0.0
    });
    expect((writePkg as any).updatedManifest('package-7').peerDependencies).toMatchObject({
      'package-2': '^2.0.0',
      'package-3': '>=1.0.0', // workspace:>=1.0.0, range shouldn't be bumped
    });
  });

  it('remove workspace protocol from external dependencies and minor bump other local dependencies with workspace protocol', async () => {
    const cwd = await initFixture('workspace-protocol-specs');
    const logErrorSpy = vi.spyOn(npmlog, 'error');

    await gitTag(cwd, 'v1.0.0');
    await setupChanges(cwd);
    await new PublishCommand(createArgv(cwd, '--bump', 'minor', '--yes', '--allow-peer-dependencies-update'));

    expect(logErrorSpy).toHaveBeenCalledWith(
      'publish',
      [
        `Your package named "package-6" has external dependencies not handled by Lerna-Lite and without workspace version suffix, `,
        `we recommend using defined versions with workspace protocol. Your dependency is currently being published with "tiny-registry": "".`,
      ].join('')
    );
    expect((writePkg as any).updatedManifest('package-6').dependencies).toMatchObject({
      'package-1': '>=1.0.0', // workspace:>=1.0.0 will not be bumped without a flag
      'tiny-registry': '', // workspace:*
      'tiny-tarball': '^2.3.4', // workspace:^2.3.4
    });
  });
});
