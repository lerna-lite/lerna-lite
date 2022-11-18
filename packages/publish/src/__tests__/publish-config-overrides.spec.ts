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
  ...jest.requireActual('@lerna-lite/core'), // return the other real methods, below we'll mock specific methods
  Command: jest.requireActual('../../../core/src/command').Command,
  conf: jest.requireActual('../../../core/src/command').conf,
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
    await fs.outputFile(path.join(cwd, `${pkgRoot}/package-1/hello.js`), 'world');
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

    expect((writePkg as any).updatedManifest('package-1')).toEqual(
      expect.objectContaining({
        gitHead: expect.any(String),
        name: 'package-1',
        main: 'dist/index.js',
        publishConfig: { access: 'public' },
        typings: 'dist/index.d.ts',
        version: '1.0.1',
      })
    );

    expect((writePkg as any).updatedManifest('package-2')).toEqual(
      expect.objectContaining({
        gitHead: expect.any(String),
        name: 'package-2',
        bin: './build/bin.js',
        browser: './build/browser.js',
        module: './build/index.mjs',
        version: '1.0.1',
      })
    );

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

    expect((writePkg as any).updatedManifest('package-1')).toEqual(
      expect.objectContaining({
        gitHead: expect.any(String),
        name: 'package-1',
        publishConfig: {
          main: 'dist/index.js',
          typings: 'dist/index.d.ts',
          access: 'public',
        },
        version: '1.0.1',
      })
    );
    expect((writePkg as any).updatedManifest('package-2')).toEqual(
      expect.objectContaining({
        gitHead: expect.any(String),
        name: 'package-2',
        publishConfig: {
          bin: './build/bin.js',
          browser: './build/browser.js',
          module: './build/index.mjs',
        },
        version: '1.0.1',
      })
    );
  });
});
