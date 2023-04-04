vi.mock('write-pkg', async () => await vi.importActual('../../../version/src/lib/__mocks__/write-pkg'));

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual<any>('../../../version/src/lib/__mocks__/git-push'));
vi.mock('../../../version/src/lib/is-anything-committed', async () => await vi.importActual<any>('../../../version/src/lib/__mocks__/is-anything-committed'));
vi.mock('../../../version/src/lib/is-behind-upstream', async () => await vi.importActual<any>('../../../version/src/lib/__mocks__/is-behind-upstream'));
vi.mock('../../../version/src/lib/remote-branch-exists', async () => await vi.importActual<any>('../../../version/src/lib/__mocks__/remote-branch-exists'));

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

// also point to the local publish command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/publish', async () => await vi.importActual('../publish-command'));
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
import { fileURLToPath } from 'node:url';

// mocked modules
import writePkg from 'write-pkg';

// helpers
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

describe('publishConfig overrides', () => {
  const setupChanges = async (cwd, pkgRoot = 'packages') => {
    await outputFile(join(cwd, `${pkgRoot}/package-1/hello.js`), 'world');
    await gitAdd(cwd, '.');
    await gitCommit(cwd, 'setup');
  };

  it('overrides npm publish with publishConfig that are valid and leave fields that are not in the whitelist to be untouched and remain in publishConfig', async () => {
    const cwd = await initFixture('normal-publish-config');

    await gitTag(cwd, 'v1.0.0');
    await setupChanges(cwd);
    await new PublishCommand(createArgv(cwd, '--bump', 'patch', '--yes'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '1.0.1',
      'package-2': '1.0.1',
      'package-3': '1.0.1',
    });

    expect((writePkg as any).updatedManifest('package-1')).toEqual({
      gitHead: expect.any(String),
      name: 'package-1',
      main: 'dist/index.js',
      publishConfig: { access: 'public' },
      typings: 'dist/index.d.ts',
      version: '1.0.1',
    });

    expect((writePkg as any).updatedManifest('package-2')).toEqual({
      gitHead: expect.any(String),
      name: 'package-2',
      bin: './build/bin.js',
      browser: './build/browser.js',
      module: './build/index.mjs',
      exports: {
        'package-b': 'dist/package-b.js',
      },
      typesVersions: {
        '*': {
          '*': ['overriden'],
        },
      },
      dependencies: {
        'package-1': '^1.0.1',
      },
      version: '1.0.1',
    });
    // publishConfig should be removed from package-2 since every fields were used as overrides
    expect((writePkg as any).updatedManifest('package-2')).not.toEqual(expect.objectContaining({ publishConfig: expect.anything() }));

    expect((writePkg as any).updatedManifest('package-3').publishConfig).toBeUndefined();
  });

  it('should not override anything and leave publishConfig untouched when --no-publish-config-overrides is provided', async () => {
    const cwd = await initFixture('normal-publish-config');

    await gitTag(cwd, 'v1.0.0');
    await setupChanges(cwd);
    await new PublishCommand(createArgv(cwd, '--bump', 'patch', '--yes', '--no-publish-config-overrides'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '1.0.1',
      'package-2': '1.0.1',
      'package-3': '1.0.1',
    });

    expect((writePkg as any).updatedManifest('package-1')).toEqual({
      gitHead: expect.any(String),
      name: 'package-1',
      main: './src/index.ts',
      publishConfig: {
        main: 'dist/index.js',
        typings: 'dist/index.d.ts',
        access: 'public',
      },
      typings: './src/index.d.ts',
      version: '1.0.1',
    });
    expect((writePkg as any).updatedManifest('package-2')).toEqual({
      gitHead: expect.any(String),
      name: 'package-2',
      dependencies: {
        'package-1': '^1.0.1',
      },
      typesVersions: {
        '*': {
          '*': ['origin'],
        },
      },
      publishConfig: {
        bin: './build/bin.js',
        browser: './build/browser.js',
        module: './build/index.mjs',
        exports: {
          'package-b': 'dist/package-b.js',
        },
        typesVersions: {
          '*': {
            '*': ['overriden'],
          },
        },
      },
      version: '1.0.1',
    });
  });
});
