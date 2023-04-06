import { describe, expect, it, vi } from 'vitest';

vi.mock('write-pkg', async () => await vi.importActual('../../../version/src/lib/__mocks__/write-pkg'));

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual('../../../version/src/lib/__mocks__/git-push'));
vi.mock('../../../version/src/lib/is-anything-committed', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-anything-committed'));
vi.mock('../../../version/src/lib/is-behind-upstream', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-behind-upstream'));
vi.mock('../../../version/src/lib/remote-branch-exists', async () => await vi.importActual('../../../version/src/lib/__mocks__/remote-branch-exists'));

// mocked modules, mock only certain methods from core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  getOneTimePassword: () => Promise.resolve('654321'),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));

// also point to the local publish command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/publish', async () => await vi.importActual('../publish-command'));
vi.mock('@lerna-lite/version', async () => await vi.importActual('../../../version/src/version-command'));

// local modules _must_ be explicitly mocked
vi.mock('../lib/get-packages-without-license', async () => await vi.importActual('../lib/__mocks__/get-packages-without-license'));
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock('../lib/get-two-factor-auth-required', async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required'));
vi.mock('../lib/pack-directory', async () => await vi.importActual('../lib/__mocks__/pack-directory'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));

import { outputFile } from 'fs-extra/esm';
import { dirname, join } from 'node:path';

// mocked modules
import writePkg from 'write-pkg';

// helpers
import { fileURLToPath } from 'node:url';
import { gitAdd } from '@lerna-test/helpers';
import { gitTag } from '@lerna-test/helpers';
import { gitCommit } from '@lerna-test/helpers';
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

// test command
import { updateLernaConfig } from '@lerna-test/helpers';
import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands';
const lernaPublish = commandRunner(cliCommands);

describe('publish --remove-package-fields', () => {
  const setupChanges = async (cwd, pkgRoot = 'packages') => {
    await outputFile(join(cwd, `${pkgRoot}/package-1/hello.js`), 'world');
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

    it('should skip configuring --remove-package-fields and work normally without touching t', async () => {
      const cwd = await initFixture('remove-fields');
      await lernaPublish(cwd)();

      const devDeps = (writePkg as any).updatedManifest('package-5').devDependencies;
      expect(devDeps).toEqual({ jest: '^29.0.0', 'tiny-tarball': '^1.0.0' });
    });

    it('should configure a simple --remove-package-fields to remove a single package child field', async () => {
      const cwd = await initFixture('remove-fields');
      await lernaPublish(cwd)('--remove-package-fields', 'devDependencies.jest');

      const devDeps = (writePkg as any).updatedManifest('package-5').devDependencies;
      expect(devDeps).toEqual({ 'tiny-tarball': '^1.0.0' });
    });

    it('should be able to remove multiple different child fields using the dot notation and by passing multiple CLI arguments', async () => {
      const cwd = await initFixture('remove-fields');

      await gitTag(cwd, 'v1.0.0');
      await setupChanges(cwd);
      await lernaPublish(cwd)('--remove-package-fields', 'devDependencies.jest', 'scripts.build:dev', 'exports.index.types');

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
