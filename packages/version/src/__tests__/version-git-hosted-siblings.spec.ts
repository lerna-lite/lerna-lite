import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { VersionCommandOption } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { describe, expect, test, vi } from 'vitest';
import * as writePkg from 'write-package';
import yargParser from 'yargs-parser';

import { VersionCommand } from '../version-command.js';

// local modules _must_ be explicitly mocked
vi.mock('../lib/git-push', async () => await vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/is-anything-committed', async () => await vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => await vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => await vi.importActual('../lib/__mocks__/remote-branch-exists'));
vi.mock('write-package', async () => await vi.importActual('../lib/__mocks__/write-package'));

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));
vi.mock('write-package', async () => await vi.importActual('../lib/__mocks__/write-package'));

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFixture = initFixtureFactory(pathResolve(__dirname, '../../../publish/src/__tests__'));

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as VersionCommandOption;
};

describe('git-hosted sibling specifiers', () => {
  test('gitCommittish', async () => {
    const cwd = await initFixture('git-hosted-sibling-committish');

    // await lernaVersion(cwd)("minor");
    await new VersionCommand(createArgv(cwd, '--bump', 'minor'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '1.1.0',
      'package-2': '1.1.0',
      'package-3': '1.1.0',
      'package-4': '1.1.0',
      'package-5': '1.1.0',
    });

    // package-1 doesn't have any dependencies
    expect((writePkg as any).updatedManifest('package-2').dependencies).toMatchObject({
      'package-1': 'github:user/package-1#v1.1.0',
    });
    expect((writePkg as any).updatedManifest('package-3').devDependencies).toMatchObject({
      'package-2': 'git+ssh://git@github.com/user/package-2.git#v1.1.0',
    });
    expect((writePkg as any).updatedManifest('package-4').dependencies).toMatchObject({
      'package-1': 'github:user/package-1#v0.0.0', // non-matching semver
    });
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      'package-1': 'git+ssh://git@github.com/user/package-1.git#v1.1.0',
    });
  });

  test('gitRange', async () => {
    const cwd = await initFixture('git-hosted-sibling-semver');

    await new VersionCommand(createArgv(cwd, '--bump', 'prerelease', '--preid', 'beta'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '1.0.1-beta.0',
      'package-2': '1.0.1-beta.0',
      'package-3': '1.0.1-beta.0',
      'package-4': '1.0.1-beta.0',
      'package-5': '1.0.1-beta.0',
    });

    // package-1 doesn't have any dependencies
    expect((writePkg as any).updatedManifest('package-2').dependencies).toMatchObject({
      'package-1': 'github:user/package-1#semver:^1.0.1-beta.0',
    });
    // TODO: investigate why this test fails
    // expect((writePkg as any).updatedManifest("package-3").devDependencies).toMatchObject({
    //   "package-2": "git+ssh://git@github.com/user/package-2.git#semver:^1.0.1-beta.0",
    // });
    expect((writePkg as any).updatedManifest('package-4').dependencies).toMatchObject({
      'package-1': 'github:user/package-1#semver:^0.1.0', // non-matching semver
    });
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      'package-1': 'git+ssh://git@github.com/user/package-1.git#semver:^1.0.1-beta.0',
    });
  });

  test('gitlab', async () => {
    const cwd = await initFixture('git-hosted-sibling-gitlab');

    await new VersionCommand(createArgv(cwd, '--bump', 'premajor', '--preid', 'rc'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '2.0.0-rc.0',
      'package-2': '2.0.0-rc.0',
      'package-3': '2.0.0-rc.0',
      'package-4': '2.0.0-rc.0',
      'package-5': '2.0.0-rc.0',
    });

    // package-1 doesn't have any dependencies
    expect((writePkg as any).updatedManifest('package-2').dependencies).toMatchObject({
      'package-1': 'gitlab:user/package-1#v2.0.0-rc.0',
    });
    expect((writePkg as any).updatedManifest('package-3').devDependencies).toMatchObject({
      'package-2': 'git+ssh://git@gitlab.com/user/package-2.git#v2.0.0-rc.0',
    });
    expect((writePkg as any).updatedManifest('package-4').dependencies).toMatchObject({
      'package-1': 'git+https://user:token@gitlab.com/user/package-1.git#v2.0.0-rc.0',
    });
    expect((writePkg as any).updatedManifest('package-5').dependencies).toMatchObject({
      'package-1': 'git+ssh://git@gitlab.com/user/package-1.git#v2.0.0-rc.0',
    });
  });
});
