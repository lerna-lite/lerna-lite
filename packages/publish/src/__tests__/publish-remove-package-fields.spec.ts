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

// mocked modules
import writePkg from 'write-pkg';

// helpers
import { gitAdd } from '@lerna-test/helpers';
import { gitTag } from '@lerna-test/helpers';
import { gitCommit } from '@lerna-test/helpers';
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(__dirname);

// test command
import { updateLernaConfig } from '@lerna-test/helpers';
import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands';
const lernaPublish = commandRunner(cliCommands);

describe('publish --remove-package-fields', () => {
  const setupChanges = async (cwd, pkgRoot = 'packages') => {
    await fs.outputFile(path.join(cwd, `${pkgRoot}/package-1/hello.js`), 'world');
    await gitAdd(cwd, '.');
    await gitCommit(cwd, 'setup');
  };

  describe('use --remove-package-fields flag from CLI', () => {
    it('should be able to remove a field from all packages by providing it in CLI', async () => {
      const cwd = await initFixture('remove-fields');

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await lernaPublish(cwd)('--remove-package-fields', 'browser');

      const publishPkg1 = (writePkg as any).updatedManifest('package-1');
      const publishPkg2 = (writePkg as any).updatedManifest('package-2');
      const publishPkg3 = (writePkg as any).updatedManifest('package-3');
      const publishPkg4 = (writePkg as any).updatedManifest('package-4');
      const publishPkg5 = (writePkg as any).updatedManifest('package-5');

      expect(publishPkg1.browser).toBeUndefined();
      expect(publishPkg2.browser).toBeUndefined();
      expect(publishPkg3.browser).toBeUndefined();
      expect(publishPkg4.browser).toBeUndefined();
      expect(publishPkg5.browser).toBeUndefined();
    });

    it('passes --ignore-changes to update collector', async () => {
      const cwd = await initFixture('remove-fields');
      await lernaPublish(cwd)('--remove-package-fields', 'devDependencies.jest');

      const devDeps = (writePkg as any).updatedManifest('package-5').devDependencies;
      expect(devDeps).toEqual({ 'tiny-tarball': '^1.0.0' });
    });

    it('should be able to remove multiple different child fields using the dot notation and by passing multiple CLI arguments', async () => {
      const cwd = await initFixture('remove-fields');

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await lernaPublish(cwd)(
        '--remove-package-fields',
        'devDependencies.jest',
        'scripts.build:dev',
        'exports.index.types'
      );

      const publishPkg5 = (writePkg as any).updatedManifest('package-5');
      expect(publishPkg5.devDependencies).toEqual({ 'tiny-tarball': '^1.0.0' });
      expect(publishPkg5.scripts).toEqual({ build: 'tsc --project tsconfig.json' });
      expect(publishPkg5.exports).toEqual({
        index: {
          import: './esm/index.js',
          require: './commonjs/index.cjs',
        },
      });
    });
  });

  describe('use "removePackageFields" from Lerna config', () => {
    it('should be able to remove a field from all packages by defining it in Lerna config', async () => {
      const cwd = await initFixture('remove-fields');

      await updateLernaConfig(cwd, {
        command: {
          publish: {
            removePackageFields: ['browser'],
          },
        },
      });

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await lernaPublish(cwd)();

      const publishPkg1 = (writePkg as any).updatedManifest('package-1');
      const publishPkg2 = (writePkg as any).updatedManifest('package-2');
      const publishPkg3 = (writePkg as any).updatedManifest('package-3');
      const publishPkg4 = (writePkg as any).updatedManifest('package-4');
      const publishPkg5 = (writePkg as any).updatedManifest('package-5');

      expect(publishPkg1.browser).toBeUndefined();
      expect(publishPkg2.browser).toBeUndefined();
      expect(publishPkg3.browser).toBeUndefined();
      expect(publishPkg4.browser).toBeUndefined();
      expect(publishPkg5.browser).toBeUndefined();
    });

    it('should be able to remove an entire array "devDependencies" field and also remove a child field using the dot notation in Lerna config', async () => {
      const cwd = await initFixture('remove-fields');

      await updateLernaConfig(cwd, {
        command: {
          publish: {
            removePackageFields: ['devDependencies', 'scripts.build', 'exports.index.types'],
          },
        },
      });

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await lernaPublish(cwd)();

      const publishPkg1 = (writePkg as any).updatedManifest('package-1');
      const publishPkg2 = (writePkg as any).updatedManifest('package-2');
      const publishPkg3 = (writePkg as any).updatedManifest('package-3');
      const publishPkg4 = (writePkg as any).updatedManifest('package-4');
      const publishPkg5 = (writePkg as any).updatedManifest('package-5');

      expect(publishPkg1.devDependencies).toBeUndefined();
      expect(publishPkg1.scripts).toEqual({});
      expect(publishPkg2.devDependencies).toBeUndefined();
      expect(publishPkg2.scripts).toEqual({
        'build:dev': 'tsc --incremental --watch',
        'pack-tarball': 'npm pack',
      });
      expect(publishPkg3.devDependencies).toBeUndefined();
      expect(publishPkg3.scripts).toEqual({
        'build:dev': 'tsc --incremental --watch',
      });
      expect(publishPkg4.devDependencies).toBeUndefined();
      expect(publishPkg4.scripts).toEqual({
        'build:dev': 'tsc --incremental --watch',
      });
      expect(publishPkg5.scripts).toEqual({ 'build:dev': 'tsc --incremental --watch' });
      expect(publishPkg5.exports).toEqual({
        index: {
          import: './esm/index.js',
          require: './commonjs/index.cjs',
        },
      });
    });
  });
});
