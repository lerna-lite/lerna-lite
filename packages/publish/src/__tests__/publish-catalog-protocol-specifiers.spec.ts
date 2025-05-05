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

import { dirname, join } from 'node:path';
// helpers
import { fileURLToPath } from 'node:url';

import { outputFile } from 'fs-extra/esm';
// mocked modules
import * as writePkg from 'write-package';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { gitAdd } from '@lerna-test/helpers';
import { gitTag } from '@lerna-test/helpers';
import { gitCommit } from '@lerna-test/helpers';
import { initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(__dirname);

// test command
import { PublishCommandOption } from '@lerna-lite/core';
import yargParser from 'yargs-parser';

import { PublishCommand } from '../index.js';

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

describe("catalog protocol 'catalog:' specifiers", () => {
  const setupChanges = async (cwd, pkgRoot = 'packages') => {
    await outputFile(join(cwd, `${pkgRoot}/package-1/hello.js`), 'world');
    await gitAdd(cwd, '.');
    await gitCommit(cwd, 'setup');
  };

  it('overwrites catalog protocol with local major bumped version before npm publish but after git commit', async () => {
    const cwd = await initFixture('catalog-protocol-specs');

    await gitTag(cwd, 'v1.0.0');
    await setupChanges(cwd);
    await new PublishCommand(createArgv(cwd, '--bump', 'major', '--yes'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '2.0.0',
      'package-2': '2.0.0',
      'package-3': '2.0.0',
      'package-4': '2.0.0',
      'package-5': '2.0.0',
    });

    expect((writePkg as any).updatedManifest('package-1').dependencies).toMatchObject({
      'fs-extra': '^11.2.0', // catalog:
      tinyrainbow: '^2.0.0', // catalog:
      'tiny-tarball': '^1.0.0',
    });
    expect((writePkg as any).updatedManifest('package-2').dependencies).toMatchObject({
      'package-1': '2.3.4', // catalog:
      tinyrainbow: '^2.0.0',
    });
    expect((writePkg as any).updatedManifest('package-2').peerDependencies).toMatchObject({
      'package-1': '2.3.4', // catalog:
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      tinyrainbow: '^2.0.0',
    });
    expect((writePkg as any).updatedManifest('package-3').dependencies).toMatchObject({
      'fs-extra': '^11.2.0', // catalog:
      'p-map': '^7.0.3', // catalog:
      tinyrainbow: '^2.0.0',
    });
    expect((writePkg as any).updatedManifest('package-4').dependencies).toMatchObject({
      'fs-extra': '^11.2.0', // catalog:
      'p-map': '^7.0.3', // catalog:
    });
    expect((writePkg as any).updatedManifest('package-4').peerDependencies).toMatchObject({
      'fs-extra': '^11.2.0',
      react: '^17.0.2',
      'react-dom': '^17.0.2',
    });
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      tinyrainbow: '^2.0.0', // catalog:
    });
    expect((writePkg as any).updatedManifest('package-5').peerDependencies).toMatchObject({
      tinyrainbow: '^2.0.0', // catalog:
    });
  });
});
