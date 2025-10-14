import { beforeAll, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual('../../../version/src/lib/__mocks__/git-push'));
vi.mock('../../../version/src/lib/is-anything-committed', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-anything-committed'));
vi.mock('../../../version/src/lib/is-behind-upstream', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-behind-upstream'));
vi.mock('../../../version/src/lib/remote-branch-exists', async () => await vi.importActual('../../../version/src/lib/__mocks__/remote-branch-exists'));

// mocked modules of @lerna-lite/version
vi.mock('@lerna-lite/version', async () => ({
  ...(await vi.importActual<any>('../../../version/src/version-command')),
  getOneTimePassword: vi.fn(),
}));

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('../../../core/src/index')),
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
}));

// also point to the local publish command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/publish', async () => await vi.importActual('../publish-command'));

// local modules _must_ be explicitly mocked
vi.mock('../lib/get-packages-without-license', async () => await vi.importActual('../lib/__mocks__/get-packages-without-license'));
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock('../lib/get-two-factor-auth-required', async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required'));
vi.mock('../lib/get-unpublished-packages', async () => await vi.importActual('../lib/__mocks__/get-unpublished-packages'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));
vi.mock('../lib/npm-dist-tag', async () => await vi.importActual('../lib/__mocks__/npm-dist-tag'));
vi.mock('../lib/pack-directory', async () => await vi.importActual('../lib/__mocks__/pack-directory'));
vi.mock('../lib/git-checkout');

vi.mock('fs-extra/esm', async () => ({
  ...(await vi.importActual<any>('fs-extra/esm')),
  outputFileSync: vi.fn(),
}));

import { dirname, join as pathJoin } from 'node:path';
import { fileURLToPath } from 'node:url';

import { outputFileSync, outputJson } from 'fs-extra/esm';

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { commitChangeToPackage } from '@lerna-test/helpers';
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { loggingOutput } from '@lerna-test/helpers/logging-output.js';
const initFixture = initFixtureFactory(__dirname);

// test command
import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands.js';
import { PublishCommand } from '../index.js';
const lernaPublish = commandRunner(cliCommands);

// mocked or stubbed modules
import { collectUpdates } from '@lerna-lite/core';
import type { PublishCommandOption } from '@lerna-lite/core';
import { logOutput, promptConfirmation } from '@lerna-lite/core';
import { getOneTimePassword } from '@lerna-lite/version';
import yargParser from 'yargs-parser';

import type { npmPublish as npmPublishMock } from '../lib/__mocks__/npm-publish.js';
import { getNpmUsername } from '../lib/get-npm-username.js';
import { getTwoFactorAuthRequired } from '../lib/get-two-factor-auth-required.js';
import { gitCheckout } from '../lib/git-checkout.js';
import * as npmDistTag from '../lib/npm-dist-tag.js';
import { npmPublish } from '../lib/npm-publish.js';
import { packDirectory } from '../lib/pack-directory.js';
import { verifyNpmPackageAccess } from '../lib/verify-npm-package-access.js';

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

const createArgv = (cwd: string, ...args: any[]) => {
  args.unshift('publish');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  argv.composed = 'composed';
  return argv as unknown as PublishCommandOption;
};

(gitCheckout as Mock).mockImplementation(() => Promise.resolve());

describe('PublishCommand', () => {
  describe('cli validation', () => {
    let cwd: string;

    beforeAll(async () => {
      cwd = await initFixture('normal');
    });

    it('exits early when no changes found', async () => {
      (collectUpdates as any).setUpdated(cwd);

      await new PublishCommand(createArgv(cwd));
      // await lernaPublish(cwd)();

      const logMessages = loggingOutput('success');
      expect(logMessages).toContain('No changed packages to publish');
      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
    });

    it('errors when --git-head is passed without from-package positional', async () => {
      const command = new PublishCommand(createArgv(cwd, '--git-head', 'deadbeef'));

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          name: 'ValidationError',
          message: `--git-head is only allowed with "from-package" positional`,
        })
      );
    });
  });

  describe('with implied versioning', () => {
    it('publishes changed packages', async () => {
      const testDir = await initFixture('normal');

      await new PublishCommand(createArgv(testDir, '--cleanup-temp-files', '--throttle'));
      // await lernaPublish(testDir)();

      expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
      expect((packDirectory as any).registry).toMatchInlineSnapshot(`
        Set {
          "package-1",
          "package-4",
          "package-2",
          "package-3",
        }
      `);
      expect((npmPublish as typeof npmPublishMock).registry).toMatchInlineSnapshot(`
        Map {
          "package-1" => "latest",
          "package-4" => "latest",
          "package-2" => "latest",
          "package-3" => "latest",
        }
      `);
      expect((npmPublish as typeof npmPublishMock).order()).toEqual([
        'package-1',
        'package-4',
        'package-2',
        'package-3',
        // package-5 is private
      ]);
      expect(npmDistTag.remove).not.toHaveBeenCalled();
      expect(npmDistTag.add).not.toHaveBeenCalled();

      expect(getNpmUsername).not.toHaveBeenCalled();
      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();

      expect(gitCheckout).toHaveBeenCalledWith(
        // the list of changed files has been asserted many times already
        expect.any(Array),
        { granularPathspec: true },
        { cwd: testDir },
        undefined
      );
    });

    it('publishes changed packages including workspace name prefix', async () => {
      const testDir = await initFixture('normal-workspace-name-prefixed');

      await new PublishCommand(createArgv(testDir));
      // await lernaPublish(testDir)();

      expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
      expect((packDirectory as any).registry).toMatchInlineSnapshot(`
        Set {
          "@my-workspace/package-1",
          "@my-workspace/package-4",
          "@my-workspace/package-2",
          "@my-workspace/package-3",
        }
      `);
      expect((npmPublish as typeof npmPublishMock).registry).toMatchInlineSnapshot(`
        Map {
          "@my-workspace/package-1" => "latest",
          "@my-workspace/package-4" => "latest",
          "@my-workspace/package-2" => "latest",
          "@my-workspace/package-3" => "latest",
        }
      `);
      expect((npmPublish as typeof npmPublishMock).order()).toEqual([
        '@my-workspace/package-1',
        '@my-workspace/package-4',
        '@my-workspace/package-2',
        '@my-workspace/package-3',
        // @my-workspace/package-5 is private
      ]);
      expect(npmDistTag.remove).not.toHaveBeenCalled();
      expect(npmDistTag.add).not.toHaveBeenCalled();

      expect(getNpmUsername).not.toHaveBeenCalled();
      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();

      expect(gitCheckout).toHaveBeenCalledWith(
        // the list of changed files has been asserted many times already
        expect.any(Array),
        { granularPathspec: true },
        { cwd: testDir },
        undefined
      );
    });

    it('publishes changed independent packages', async () => {
      const testDir = await initFixture('independent');

      await new PublishCommand(createArgv(testDir));

      expect((npmPublish as typeof npmPublishMock).order()).toEqual([
        'package-1',
        'package-4',
        'package-6',
        'package-2',
        'package-3',
        // package-5 is private
      ]);
    });

    it('publishes only the filtered packages when providing a --scope', async () => {
      const testDir = await initFixture('independent');

      await new PublishCommand(createArgv(testDir, '--scope', 'package-1'));

      expect((npmPublish as typeof npmPublishMock).order()).toEqual(['package-1']);
    });

    it('publishes only the packages that are not --ignore(d)', async () => {
      const testDir = await initFixture('independent');

      await new PublishCommand(createArgv(testDir, '--ignore', 'package-@(2|3|4)'));

      expect((npmPublish as typeof npmPublishMock).order()).toEqual(['package-1', 'package-6']);
    });

    it('throws an error in fixed mode when --independent is passed', async () => {
      const testDir = await initFixture('normal');
      // const command = lernaPublish(testDir)("--independent");
      const command = new PublishCommand(createArgv(testDir, '--independent'));

      await expect(command).rejects.toThrow('independent');
    });
  });

  describe('--graph-type', () => {
    it('produces a topological ordering that _includes_ devDependencies when value is not set', async () => {
      const cwd = await initFixture('normal');

      await new PublishCommand(createArgv(cwd));

      expect((npmPublish as typeof npmPublishMock).order()).toEqual([
        'package-1',
        'package-4',
        'package-2',
        // package-3 has a peer/devDependency on package-2
        'package-3',
        // package-5 is private
      ]);
    });

    it("produces a topological ordering that _excludes_ devDependencies when value is 'dependencies' (DEPRECATED)", async () => {
      const cwd = await initFixture('normal');

      await new PublishCommand(createArgv(cwd, '--graph-type', 'dependencies'));

      expect((npmPublish as typeof npmPublishMock).order()).toEqual([
        'package-1',
        // package-3 has a peer/devDependency on package-2
        'package-3',
        'package-4',
        'package-2',
        // package-5 is private
      ]);

      const logMessages = loggingOutput('warn');
      expect(logMessages).toMatchInlineSnapshot(`
        [
          "--graph-type=dependencies is deprecated and will be removed in the next major version of lerna-lite. If you have a use-case you feel requires it please open an issue to discuss: https://github.com/lerna/lerna/issues/new/choose",
          "we recommend using --sync-workspace-lock which will sync your lock file via your favorite npm client instead of relying on Lerna-Lite itself to update it.",
        ]
      `);
    });

    it("produces a topological ordering that _includes_ devDependencies when value is 'all'", async () => {
      const cwd = await initFixture('normal');

      // await lernaPublish(cwd)("--graph-type", "all");
      await new PublishCommand(createArgv(cwd, '--graph-type', 'all'));

      expect((npmPublish as typeof npmPublishMock).order()).toEqual([
        'package-1',
        'package-4',
        'package-2',
        // package-3 has a peer/devDependency on package-2
        'package-3',
        // package-5 is private
      ]);
    });

    it("throws an error when value is _not_ 'all' or 'dependencies'", async () => {
      const testDir = await initFixture('normal');
      const command = lernaPublish(testDir)('--graph-type', 'poopy-pants');

      await expect(command).rejects.toThrow('poopy-pants');
    });
  });

  describe('--no-sort', () => {
    it('produces a lexical ordering when --no-sort is set', async () => {
      const cwd = await initFixture('normal');

      await new PublishCommand(createArgv(cwd, '--no-sort'));

      expect((npmPublish as typeof npmPublishMock).order()).toEqual([
        'package-1',
        'package-2',
        'package-3',
        'package-4',
        // package-5 is private
      ]);
    });
  });

  describe('--otp', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    (getOneTimePassword as Mock).mockImplementation(() => Promise.resolve('654321'));

    it('passes one-time password to npm commands', async () => {
      const testDir = await initFixture('normal');
      const otp = 123456;

      // cli option skips prompt
      (getTwoFactorAuthRequired as Mock).mockResolvedValueOnce(true);

      await new PublishCommand(createArgv(testDir, '--otp', otp));

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ otp }),
        expect.objectContaining({ root: expect.any(Object) }),
        expect.objectContaining({ otp })
      );
      expect(getOneTimePassword).not.toHaveBeenCalled();
    });

    it('skips one-time password prompt when already found in cache', async () => {
      const testDir = await initFixture('normal');
      const otp = '654321';

      (getTwoFactorAuthRequired as Mock).mockResolvedValueOnce(true);

      const command = new PublishCommand(createArgv(testDir, '--verify-access', true));
      await command;
      command.conf.set('otp', otp);
      await command.publishPacked();

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ otp: undefined }),
        expect.objectContaining({ root: expect.any(Object) }),
        expect.objectContaining({ otp: '654321' })
      );
      expect(getOneTimePassword).toHaveBeenCalledTimes(1);
    });

    it('prompts for OTP when option missing, account-level 2FA enabled, and verify access is true', async () => {
      const testDir = await initFixture('normal');

      (getTwoFactorAuthRequired as Mock).mockResolvedValueOnce(true);

      await new PublishCommand(createArgv(testDir, '--verify-access', true));

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ otp: undefined }),
        expect.objectContaining({ root: expect.any(Object) }),
        expect.objectContaining({ otp: '654321' })
      );
      expect(getOneTimePassword).toHaveBeenLastCalledWith('Enter OTP:');
    });

    it('prompts for OTP when option missing, account-level 2FA enabled and shows a log info about it when in --dry-run mode', async () => {
      const testDir = await initFixture('normal');

      (getTwoFactorAuthRequired as Mock).mockResolvedValueOnce(true);

      await new PublishCommand(createArgv(testDir, '--verify-access', true, '--dry-run'));
      const logMessages = loggingOutput('info');

      expect(logMessages).toContain('will ask OTP');
    });

    it('defers OTP prompt when option missing, account-level 2FA enabled, and verify access is not true', async () => {
      const testDir = await initFixture('normal');

      (getTwoFactorAuthRequired as Mock).mockResolvedValueOnce(true);

      await lernaPublish(testDir)();

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ otp: undefined }),
        expect.objectContaining({ root: expect.any(Object) }),
        expect.objectContaining({ otp: undefined })
      );
      expect(getOneTimePassword).not.toHaveBeenCalled();
    });
  });

  describe('OTP Retry Logic', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('retries publishing a package after OTP expiration', async () => {
      const testDir = await initFixture('normal');

      // Simulate OTP expiration on the first publish attempt
      (npmPublish as Mock).mockImplementationOnce(() => {
        const error = new Error('OTP expired') as any;
        error.code = 'EOTP';
        throw error;
      });

      // Simulate successful OTP re-request
      (getOneTimePassword as Mock).mockResolvedValueOnce('123456');

      await new PublishCommand(createArgv(testDir));

      expect(getOneTimePassword).toHaveBeenCalledTimes(1);
      expect(npmPublish).toHaveBeenCalledTimes(5); // 4 initial calls + 1 retry for package-1
    });

    it('fails the process if OTP is not provided after expiration', async () => {
      const testDir = await initFixture('normal');

      // Simulate OTP expiration on the first publish attempt
      (npmPublish as Mock).mockImplementationOnce(() => {
        const error = new Error('OTP expired') as any;
        error.code = 'EOTP';
        throw error;
      });

      // Simulate user not providing an OTP
      (getOneTimePassword as Mock).mockRejectedValueOnce(new Error('User canceled OTP input'));

      const command = new PublishCommand(createArgv(testDir, '--no-sort'));
      await expect(command).rejects.toThrow('User canceled OTP input');

      expect(getOneTimePassword).toHaveBeenCalledTimes(1);
      expect(npmPublish).toHaveBeenCalledTimes(3); // Only 3 calls before aborting
    });
  });

  describe('Version Conflict Handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('skips publishing a package with a version conflict', async () => {
      const testDir = await initFixture('normal');

      // Simulate a version conflict error
      (npmPublish as Mock).mockImplementationOnce(() => {
        const error = new Error('Version conflict') as any;
        error.code = 'E409';
        throw error;
      });

      await new PublishCommand(createArgv(testDir, '--no-sort'));

      expect(npmPublish).toHaveBeenCalledTimes(4); // 4 initial calls, but one fails due to conflict
      const logMessages = loggingOutput('warn');
      expect(logMessages).toEqual(expect.arrayContaining(['Package is already published: package-1@1.0.1']));
    });
  });

  describe('Integration of OTP Retry and Version Conflict Handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('handles both OTP expiration and version conflicts gracefully', async () => {
      const testDir = await initFixture('normal');

      // Simulate OTP expiration on the first publish attempt
      (npmPublish as Mock).mockImplementationOnce(() => {
        const error = new Error('OTP expired') as any;
        error.code = 'EOTP';
        throw error;
      });

      // Simulate successful OTP re-request
      (getOneTimePassword as Mock).mockResolvedValueOnce('123456');

      // Simulate a version conflict on the second package
      (npmPublish as Mock).mockImplementationOnce(() => {
        const error = new Error('Version conflict') as any;
        error.code = 'E409';
        throw error;
      });

      await new PublishCommand(createArgv(testDir, '--no-sort'));

      expect(getOneTimePassword).toHaveBeenCalledTimes(1);
      expect(npmPublish).toHaveBeenCalledTimes(5); // 4 initial calls + 1 retry for package-1
      const logMessages = loggingOutput('warn');
      expect(logMessages).toEqual(expect.arrayContaining(['Package is already published: package-2@1.0.1']));
    });
  });

  describe('--legacy-auth', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('passes auth to npm commands', async () => {
      const testDir = await initFixture('normal');
      const data = 'hi:mom';
      const auth = Buffer.from(data).toString('base64');

      // await lernaPublish(testDir)("--legacy-auth", auth);
      await new PublishCommand(createArgv(testDir, '--legacy-auth', auth));

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ 'auth-type': 'legacy', _auth: auth }),
        expect.objectContaining({ root: expect.any(Object) }),
        expect.objectContaining({ otp: undefined })
      );
    });
  });

  describe('--registry', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('passes registry to npm commands that also includes workspace in the name prefix', async () => {
      const testDir = await initFixture('normal-workspace-name-prefixed');
      const registry = 'https://my-private-registry';

      await lernaPublish(testDir)('--registry', registry);

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: '@my-workspace/package-1' }),
        '/TEMP_DIR/@my-workspace/package-1-MOCKED.tgz',
        expect.objectContaining({ registry }),
        expect.objectContaining({ root: expect.any(Object) }),
        expect.objectContaining({ otp: undefined })
      );
    });

    it('overwrites yarn registry proxy with https://registry.npmjs.org/', async () => {
      const testDir = await initFixture('normal');
      const registry = 'https://registry.yarnpkg.com';

      // await lernaPublish(testDir)("--registry", registry);
      await new PublishCommand(createArgv(testDir, '--registry', registry));

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ registry: 'https://registry.npmjs.org/' }),
        expect.objectContaining({ root: expect.any(Object) }),
        expect.objectContaining({ otp: undefined })
      );

      const logMessages = loggingOutput('warn');
      expect(logMessages).toContain("Yarn's registry proxy is broken, replacing with public npm registry");
      expect(logMessages).toContain('If you don\'t have an npm token, you should exit and run "npm login"');
    });

    it('skips validation on any other third-party registry', async () => {
      const testDir = await initFixture('normal');
      const registry = 'https://my-incompatible-registry.com';

      // await lernaPublish(testDir)("--registry", registry);
      await new PublishCommand(createArgv(testDir, '--registry', registry));

      const logMessages = loggingOutput('notice');
      expect(logMessages).toContain('Skipping all user and access validation due to third-party registry');
    });
  });

  describe('--summary-file', () => {
    it('skips creating the summary file', async () => {
      (outputFileSync as any).mockImplementationOnce(() => true);
      const cwd = await initFixture('normal');
      await lernaPublish(cwd);

      expect(outputFileSync).not.toHaveBeenCalled();
    });

    it('creates the summary file within the provided directory', async () => {
      const cwd = await initFixture('normal');
      await lernaPublish(cwd)('--summary-file', './outputs');

      const expectedJsonResponse = [
        { packageName: 'package-1', version: '1.0.1' },
        { packageName: 'package-2', version: '1.0.1' },
        { packageName: 'package-3', version: '1.0.1' },
        { packageName: 'package-4', version: '1.0.1' },
      ];
      expect(outputFileSync).toHaveBeenCalledWith(pathJoin(process.cwd(), 'outputs/lerna-publish-summary.json'), JSON.stringify(expectedJsonResponse));
    });

    it('creates the summary file at the root when no custom directory is provided', async () => {
      const cwd = await initFixture('normal');
      await lernaPublish(cwd)('--summary-file');

      const expectedJsonResponse = [
        { packageName: 'package-1', version: '1.0.1' },
        { packageName: 'package-2', version: '1.0.1' },
        { packageName: 'package-3', version: '1.0.1' },
        { packageName: 'package-4', version: '1.0.1' },
      ];

      expect(outputFileSync).toHaveBeenCalledWith(pathJoin(process.cwd(), './lerna-publish-summary.json'), JSON.stringify(expectedJsonResponse));
    });

    it('creates the summary file in the provided file path', async () => {
      const cwd = await initFixture('normal');
      await lernaPublish(cwd)('--summary-file', './outputs/lerna-publish-summary.json');

      const expectedJsonResponse = [
        { packageName: 'package-1', version: '1.0.1' },
        { packageName: 'package-2', version: '1.0.1' },
        { packageName: 'package-3', version: '1.0.1' },
        { packageName: 'package-4', version: '1.0.1' },
      ];
      expect(outputFileSync).toHaveBeenCalledWith(pathJoin(process.cwd(), 'outputs/lerna-publish-summary.json'), JSON.stringify(expectedJsonResponse));
    });
  });

  describe('--verify-access', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("publishes packages after verifying the user's access to each package", async () => {
      const testDir = await initFixture('normal');

      await lernaPublish(testDir)('--verify-access');

      expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
      expect((packDirectory as any).registry).toMatchInlineSnapshot(`
        Set {
          "package-1",
          "package-4",
          "package-2",
          "package-3",
        }
      `);
      expect((npmPublish as typeof npmPublishMock).registry).toMatchInlineSnapshot(`
        Map {
          "package-1" => "latest",
          "package-4" => "latest",
          "package-2" => "latest",
          "package-3" => "latest",
        }
      `);
      expect((npmPublish as typeof npmPublishMock).order()).toEqual([
        'package-1',
        'package-4',
        'package-2',
        'package-3',
        // package-5 is private
      ]);
      expect(npmDistTag.remove).not.toHaveBeenCalled();
      expect(npmDistTag.add).not.toHaveBeenCalled();

      expect(getNpmUsername).toHaveBeenCalled();
      expect(getNpmUsername).toHaveBeenLastCalledWith(expect.objectContaining({ registry: 'https://registry.npmjs.org/' }));

      expect(verifyNpmPackageAccess).toHaveBeenCalled();
      expect(verifyNpmPackageAccess).toHaveBeenLastCalledWith(
        expect.any(Array),
        'lerna-test',
        expect.objectContaining({ registry: 'https://registry.npmjs.org/' })
      );

      expect(getTwoFactorAuthRequired).toHaveBeenCalled();
      expect(getTwoFactorAuthRequired).toHaveBeenLastCalledWith(expect.objectContaining({ otp: undefined }));

      expect(gitCheckout).toHaveBeenCalledWith(expect.any(Array), { granularPathspec: true }, { cwd: testDir }, undefined);
    });
  });

  describe('--no-verify-access', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows warning that this is the default behavior and that this option is no longer needed', async () => {
      const cwd = await initFixture('normal');

      await lernaPublish(cwd)('--no-verify-access');

      const logMessages = loggingOutput('warn');
      expect(logMessages).toContain(
        '--verify-access=false and --no-verify-access are no longer needed, because the legacy preemptive access verification is now disabled by default. Requests will fail with appropriate errors when not authorized correctly.'
      );
    });

    it('skips package access verification', async () => {
      const cwd = await initFixture('normal');

      // await lernaPublish(cwd)("--no-verify-access");
      await new PublishCommand(createArgv(cwd, '--no-verify-access'));

      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
    });

    it('is implied when npm username is undefined', async () => {
      (getNpmUsername as Mock).mockImplementationOnce(() => Promise.resolve());

      const cwd = await initFixture('normal');

      // await lernaPublish(cwd)("--registry", "https://my-private-registry");
      await new PublishCommand(createArgv(cwd, '--registry', 'https://my-private-registry'));

      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
    });
  });

  describe('--no-git-reset', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('skips git checkout of package manifests', async () => {
      const cwd = await initFixture('normal');

      // await lernaPublish(cwd)("--no-git-reset");
      await new PublishCommand(createArgv(cwd, '--no-git-reset'));

      expect(gitCheckout).not.toHaveBeenCalled();
    });
  });

  // TODO: (major) make --no-granular-pathspec the default
  describe('--no-granular-pathspec', () => {
    it('resets staged changes globally', async () => {
      const cwd = await initFixture('normal');

      await lernaPublish(cwd)('--no-granular-pathspec');

      expect(gitCheckout).toHaveBeenCalledWith(
        // the list of changed files has been asserted many times already
        expect.any(Array),
        { granularPathspec: false },
        { cwd },
        undefined
      );
    });
  });

  describe('--contents', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('allows you to do fancy angular crap', async () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      const cwd = await initFixture('lifecycle');

      await new PublishCommand(createArgv(cwd, '--contents', 'dist'));

      const [[pkgOne, dirOne, opts], [pkgTwo, dirTwo]] = (packDirectory as Mock).mock.calls;

      // second argument to packDirectory() is the location, _not_ the contents
      expect(dirOne).toBe(pkgOne.location);
      expect(dirTwo).toBe(pkgTwo.location);

      expect(pkgOne.contents).toBe(pathJoin(pkgOne.location, 'dist'));
      expect(pkgTwo.contents).toBe(pathJoin(pkgTwo.location, 'dist'));

      // opts is a snapshot of npm-conf instance
      expect(packDirectory).toHaveBeenCalledWith(pkgOne, dirOne, opts, { ignoreMissing: true });
      expect(packDirectory).toHaveBeenCalledWith(pkgTwo, dirTwo, opts, { ignoreMissing: true });
    });
  });

  describe('publishConfig.directory', () => {
    it('mimics effect of --contents, but per-package', async () => {
      const cwd = await initFixture('lifecycle');

      await commitChangeToPackage(cwd, 'package-1', 'chore: setup', {
        publishConfig: {
          directory: 'dist',
        },
      });

      await new PublishCommand(createArgv(cwd));

      expect(packDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'package-1',
          contents: pathJoin(cwd, 'packages/package-1/dist'),
        }),
        pathJoin(cwd, 'packages/package-1'),
        expect.any(Object),
        { ignoreMissing: true }
      );
      expect(packDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'package-2',
          contents: pathJoin(cwd, 'packages/package-2'),
        }),
        pathJoin(cwd, 'packages/package-2'),
        expect.any(Object),
        { ignoreMissing: true }
      );
    });
  });

  describe('in a cyclical repo', () => {
    it('should throw an error with --reject-cycles', async () => {
      const testDir = await initFixture('toposort');
      const command = new PublishCommand(createArgv(testDir, '--reject-cycles'));

      await expect(command).rejects.toThrow('Dependency cycles detected, you should fix these!');
    });
  });

  describe('"describeTag" config', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('set "describeTag" in lerna.json', async () => {
      const testDir = await initFixture('normal');

      await outputJson(pathJoin(testDir, 'lerna.json'), {
        version: 'independent',
        describeTag: '*custom-tag*',
      });
      await new PublishCommand(createArgv(testDir, '--canary'));

      expect((collectUpdates as Mock).mock.calls[0][3].describeTag).toBe('*custom-tag*');

      expect((collectUpdates as Mock).mock.calls[0][3].isIndependent).toBe(true);
    });
  });

  describe('PublishCommand provenance transparency log URLs', () => {
    it('prints package name and provenance URL when present in publish result', async () => {
      const cwd = await initFixture('normal');
      // Simulate npmPublish returning a transparencyLogUrl for two packages
      (npmPublish as typeof npmPublishMock)
        .mockResolvedValueOnce({ transparencyLogUrl: 'https://search.sigstore.dev/?logIndex=111' })
        .mockResolvedValueOnce({ transparencyLogUrl: 'https://search.sigstore.dev/?logIndex=222' })
        .mockResolvedValueOnce({ transparencyLogUrl: 'https://search.sigstore.dev/?logIndex=333' })
        .mockResolvedValueOnce({ transparencyLogUrl: 'https://search.sigstore.dev/?logIndex=444' });

      await new PublishCommand(createArgv(cwd));

      expect(logOutput).toHaveBeenCalledWith('The following Provenance transparency log entries were created during publishing:');
      // Check that both package names and URLs are present in the output
      expect(logOutput).toHaveBeenCalledWith(expect.stringContaining('package-1: https://search.sigstore.dev/?logIndex=111'));
      expect(logOutput).toHaveBeenCalledWith(expect.stringContaining('package-2: https://search.sigstore.dev/?logIndex=333')); // URLs are offset because of the dep graph
      expect(logOutput).toHaveBeenCalledWith(expect.stringContaining('package-3: https://search.sigstore.dev/?logIndex=444'));
      expect(logOutput).toHaveBeenCalledWith(expect.stringContaining('package-4: https://search.sigstore.dev/?logIndex=222'));
    });

    it('does not print provenance URLs if none are present', async () => {
      const cwd = await initFixture('normal');
      // Simulate npmPublish returning no transparencyLogUrl
      (npmPublish as any).mockResolvedValue({});

      await new PublishCommand(createArgv(cwd));

      expect(logOutput).not.toHaveBeenCalledWith('The following Provenance transparency log entries were created during publishing:');
      expect(logOutput).not.toHaveBeenCalledWith(expect.stringContaining('package-1: https://search.sigstore.dev/?logIndex=111'));
    });
  });
});
