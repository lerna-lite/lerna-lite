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

// also point to the local publish command so that all mocks are properly used even by the command-runner
jest.mock('@lerna-lite/publish', () => jest.requireActual('../publish-command'));

// local modules _must_ be explicitly mocked
jest.mock('../lib/get-packages-without-license', () =>
  jest.requireActual('../lib/__mocks__/get-packages-without-license')
);
jest.mock('../lib/verify-npm-package-access', () => jest.requireActual('../lib/__mocks__/verify-npm-package-access'));
jest.mock('../lib/get-npm-username', () => jest.requireActual('../lib/__mocks__/get-npm-username'));
jest.mock('../lib/get-two-factor-auth-required', () =>
  jest.requireActual('../lib/__mocks__/get-two-factor-auth-required')
);
jest.mock('../lib/pack-directory', () => jest.requireActual('../lib/__mocks__/pack-directory'));
jest.mock('../lib/npm-publish', () => jest.requireActual('../lib/__mocks__/npm-publish'));

import fs from 'fs-extra';
import path from 'path';
import npmlog from 'npmlog';

// mocked modules
import writePkg from 'write-pkg';

// helpers
import { gitAdd } from '@lerna-test/helpers';
import { gitTag } from '@lerna-test/helpers';
import { gitCommit } from '@lerna-test/helpers';
import helpers from '@lerna-test/helpers';
const initFixture = helpers.initFixtureFactory(__dirname);

// test command
import { PublishCommand } from '../index';

import yargParser from 'yargs-parser';

const createArgv = (cwd, ...args) => {
  args.unshift('publish');
  if (args.length > 0 && args[1] && args[1].length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv;
};

describe("workspace protocol 'workspace:' specifiers", () => {
  const setupChanges = async (cwd, pkgRoot = 'packages') => {
    await fs.outputFile(path.join(cwd, `${pkgRoot}/package-1/hello.js`), 'world');
    await gitAdd(cwd, '.');
    await gitCommit(cwd, 'setup');
  };

  describe('workspace-strict-match disabled', () => {
    it('overwrites workspace protocol with local patch bump version before npm publish but after git commit', async () => {
      const cwd = await initFixture('workspace-protocol-specs');

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await new PublishCommand(createArgv(cwd, '--bump', 'patch', '--yes', '--no-workspace-strict-match'));

      expect((writePkg as any).updatedVersions()).toEqual({
        'package-1': '1.0.1',
        'package-2': '1.0.1',
        'package-3': '1.0.1',
        'package-4': '1.0.1',
        'package-5': '1.0.1',
        'package-6': '1.0.1',
        'package-7': '1.0.1',
      });

      // notably missing is package-1, which has no relative file: dependencies
      expect((writePkg as any).updatedManifest('package-2').dependencies).toMatchObject({
        'package-1': '^1.0.1', // workspace:*
      });
      expect((writePkg as any).updatedManifest('package-3').dependencies).toMatchObject({
        'package-2': '^1.0.1', // workspace:^
      });
      expect((writePkg as any).updatedManifest('package-4').optionalDependencies).toMatchObject({
        'package-3': '^1.0.1', // workspace:~
      });
      expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
        // all fixed versions are bumped when patch
        'package-4': '^1.0.1', // workspace:^1.0.0
        'package-6': '^1.0.1', // workspace:^1.0.0
      });
      // private packages do not need local version resolution
      expect((writePkg as any).updatedManifest('package-7').dependencies).toMatchObject({
        'package-1': '^1.0.1', // ^1.0.0
      });
    });

    it('overwrites workspace protocol with local minor bump version before npm publish but after git commit', async () => {
      const cwd = await initFixture('workspace-protocol-specs');

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await new PublishCommand(createArgv(cwd, '--bump', 'minor', '--yes', '--no-workspace-strict-match'));

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
        'package-1': '^1.1.0', // workspace:*
      });
      expect((writePkg as any).updatedManifest('package-3').dependencies).toMatchObject({
        'package-2': '^1.1.0', // workspace:^
      });
      expect((writePkg as any).updatedManifest('package-4').optionalDependencies).toMatchObject({
        'package-3': '^1.1.0', // workspace:~
      });
      expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
        // all fixed versions are bumped when minor
        'package-4': '^1.1.0', // workspace:^1.0.0
        'package-6': '^1.1.0', // workspace:^1.0.0
      });
      // private packages do not need local version resolution
      expect((writePkg as any).updatedManifest('package-7').dependencies).toMatchObject({
        'package-1': '^1.1.0', // ^1.0.0
      });
    });
  });

  describe('workspace-strict-match enabled', () => {
    it('overwrites workspace protocol with local minor bump version before npm publish but after git commit', async () => {
      const cwd = await initFixture('workspace-protocol-specs');

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await new PublishCommand(createArgv(cwd, '--bump', 'minor', '--yes', '--workspace-strict-match'));

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
      expect((writePkg as any).updatedManifest('package-3').dependencies).toMatchObject({
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
      expect((writePkg as any).updatedManifest('package-6').dependencies).toMatchObject({
        'package-1': '>=1.1.0', // workspace:>=1.0.0
      });
      // private packages do not need local version resolution
      expect((writePkg as any).updatedManifest('package-7').dependencies).toMatchObject({
        'package-1': '^1.1.0', // ^1.0.0
      });
    });

    it('overwrites workspace protocol with local major bump version before npm publish but after git commit', async () => {
      const cwd = await initFixture('workspace-protocol-specs');

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
        'package-1': '2.0.0', // workspace:*
      });
      expect((writePkg as any).updatedManifest('package-3').dependencies).toMatchObject({
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
      expect((writePkg as any).updatedManifest('package-6').dependencies).toMatchObject({
        'package-1': '>=2.0.0', // workspace:>=1.0.0
      });
      // private packages do not need local version resolution
      expect((writePkg as any).updatedManifest('package-7').dependencies).toMatchObject({
        'package-1': '^2.0.0', // ^1.0.0
      });
    });

    it('remove workspace protocol from external dependencies and minor bump other local dependencies with workspace protocol', async () => {
      const cwd = await initFixture('workspace-protocol-specs');
      const logErrorSpy = jest.spyOn(npmlog, 'error');

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await new PublishCommand(createArgv(cwd, '--bump', 'minor', '--yes', '--workspace-strict-match'));

      expect(logErrorSpy).toHaveBeenCalledWith(
        'publish',
        [
          `Your package named "package-6" has external dependencies not handled by Lerna-Lite and without workspace version suffix, `,
          `we recommend using defined versions with workspace protocol. Your dependency is currently being published with "tiny-registry": "latest".`,
        ].join('')
      );
      expect((writePkg as any).updatedManifest('package-6').dependencies).toMatchObject({
        'package-1': '>=1.1.0', // workspace:>=1.0.0
        'tiny-registry': 'latest', // workspace:*
        'tiny-tarball': '^2.3.4', // workspace:^2.3.4
      });
    });
  });
});
