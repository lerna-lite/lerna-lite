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
  getOneTimePassword: jest.fn(),
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
jest.mock('../lib/get-unpublished-packages', () => jest.requireActual('../lib/__mocks__/get-unpublished-packages'));
jest.mock('../lib/npm-publish', () => jest.requireActual('../lib/__mocks__/npm-publish'));
jest.mock('../lib/npm-dist-tag', () => jest.requireActual('../lib/__mocks__/npm-dist-tag'));
jest.mock('../lib/pack-directory', () => jest.requireActual('../lib/__mocks__/pack-directory'));
jest.mock('../lib/git-checkout');

import fs from 'fs-extra';
import path from 'path';

// helpers
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import { commitChangeToPackage } from '@lerna-test/helpers';
import helpers from '@lerna-test/helpers';
const initFixture = helpers.initFixtureFactory(__dirname);

// test command
import { PublishCommand } from '../index';
import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands';
const lernaPublish = helpers.commandRunner(cliCommands);

import yargParser from 'yargs-parser';

// mocked or stubbed modules
import { npmPublish } from '../lib/npm-publish';
import { promptConfirmation } from '@lerna-lite/core';
import { getOneTimePassword, collectUpdates } from '@lerna-lite/core';
import { packDirectory } from '../lib/pack-directory';
import { getNpmUsername } from '../lib/get-npm-username';
import { verifyNpmPackageAccess } from '../lib/verify-npm-package-access';
import { getTwoFactorAuthRequired } from '../lib/get-two-factor-auth-required';
import { gitCheckout } from '../lib/git-checkout';
const npmDistTag = require('../lib/npm-dist-tag');

const createArgv = (cwd, ...args) => {
  args.unshift('publish');
  if (args.length > 0 && args[1] && args[1].length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  argv.composed = 'composed';
  return argv;
};

(gitCheckout as any).mockImplementation(() => Promise.resolve());

describe('PublishCommand', () => {
  describe('cli validation', () => {
    let cwd;

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

    it('exits non-zero with --scope', async () => {
      const command = lernaPublish(cwd)('--scope', 'package-1');

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          exitCode: 1,
          message: 'Unknown argument: scope',
        })
      );
    });

    it('exits non-zero with --since', async () => {
      const command = lernaPublish(cwd)('--since', 'main');

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          exitCode: 1,
          message: 'Unknown argument: since',
        })
      );
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

      await new PublishCommand(createArgv(testDir));
      // await lernaPublish(testDir)();

      expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
      expect((packDirectory as any).registry).toMatchInlineSnapshot(`
Set {
  "package-1",
  "package-3",
  "package-4",
  "package-2",
}
`);
      expect((npmPublish as any).registry).toMatchInlineSnapshot(`
Map {
  "package-1" => "latest",
  "package-3" => "latest",
  "package-4" => "latest",
  "package-2" => "latest",
}
`);
      expect((npmPublish as any).order()).toEqual([
        'package-1',
        'package-3',
        'package-4',
        'package-2',
        // package-5 is private
      ]);
      expect(npmDistTag.remove).not.toHaveBeenCalled();
      expect(npmDistTag.add).not.toHaveBeenCalled();

      expect(getNpmUsername).toHaveBeenCalled();
      expect(getNpmUsername).toHaveBeenLastCalledWith(
        expect.objectContaining({ registry: 'https://registry.npmjs.org/' })
      );

      expect(verifyNpmPackageAccess).toHaveBeenCalled();
      expect(verifyNpmPackageAccess).toHaveBeenLastCalledWith(
        expect.any(Array),
        'lerna-test',
        expect.objectContaining({ registry: 'https://registry.npmjs.org/' })
      );

      expect(getTwoFactorAuthRequired).toHaveBeenCalled();
      expect(getTwoFactorAuthRequired).toHaveBeenLastCalledWith(
        // extra insurance that @lerna/npm-conf is defaulting things correctly
        expect.objectContaining({ otp: undefined })
      );

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
      // await lernaPublish(testDir)();

      expect((npmPublish as any).order()).toEqual([
        'package-1',
        'package-3',
        'package-4',
        'package-2',
        // package-5 is private
      ]);
    });

    it('throws an error in fixed mode when --independent is passed', async () => {
      const testDir = await initFixture('normal');
      // const command = lernaPublish(testDir)("--independent");
      const command = new PublishCommand(createArgv(testDir, '--independent'));

      await expect(command).rejects.toThrow('independent');
    });
  });

  describe('--graph-type', () => {
    it("produces a topological ordering that _includes_ devDependencies when value is 'all'", async () => {
      const cwd = await initFixture('normal');

      // await lernaPublish(cwd)("--graph-type", "all");
      await new PublishCommand(createArgv(cwd, '--graph-type', 'all'));

      expect((npmPublish as any).order()).toEqual([
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

  describe('--otp', () => {
    (getOneTimePassword as any).mockImplementation(() => Promise.resolve('654321'));

    it('passes one-time password to npm commands', async () => {
      const testDir = await initFixture('normal');
      const otp = 123456;

      // cli option skips prompt
      (getTwoFactorAuthRequired as any).mockResolvedValueOnce(true);

      // await lernaPublish(testDir)("--otp", otp);
      await new PublishCommand(createArgv(testDir, '--otp', otp));

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ otp }),
        expect.objectContaining({ otp })
      );
      expect(getOneTimePassword).not.toHaveBeenCalled();
    });

    it('prompts for OTP when option missing and account-level 2FA enabled', async () => {
      const testDir = await initFixture('normal');

      (getTwoFactorAuthRequired as any).mockResolvedValueOnce(true);

      // await lernaPublish(testDir)();
      await new PublishCommand(createArgv(testDir));

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ otp: undefined }),
        expect.objectContaining({ otp: '654321' })
      );
      expect(getOneTimePassword).toHaveBeenLastCalledWith('Enter OTP:');
    });
  });

  describe('--legacy-auth', () => {
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
        expect.objectContaining({ otp: undefined })
      );
    });
  });

  describe('--registry', () => {
    it('passes registry to npm commands', async () => {
      const testDir = await initFixture('normal');
      const registry = 'https://my-private-registry';

      // await lernaPublish(testDir)("--registry", registry);
      await new PublishCommand(createArgv(testDir, '--registry', registry));

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'package-1' }),
        '/TEMP_DIR/package-1-MOCKED.tgz',
        expect.objectContaining({ registry }),
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

  describe('--no-verify-access', () => {
    it('skips package access verification', async () => {
      const cwd = await initFixture('normal');

      // await lernaPublish(cwd)("--no-verify-access");
      await new PublishCommand(createArgv(cwd, '--no-verify-access'));

      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
    });

    it('is implied when npm username is undefined', async () => {
      (getNpmUsername as any).mockImplementationOnce(() => Promise.resolve());

      const cwd = await initFixture('normal');

      // await lernaPublish(cwd)("--registry", "https://my-private-registry");
      await new PublishCommand(createArgv(cwd, '--registry', 'https://my-private-registry'));

      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
    });
  });

  describe('--no-git-reset', () => {
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

    xit('consumes configuration from lerna.json', async () => {
      const cwd = await initFixture('normal');

      await fs.outputJSON(path.join(cwd, 'lerna.json'), {
        version: '1.0.0',
        granularPathspec: false,
      });
      await lernaPublish(cwd)();

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
    it('allows you to do fancy angular crap', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const cwd = await initFixture('lifecycle');

      await new PublishCommand(createArgv(cwd, '--contents', 'dist'));

      const [[pkgOne, dirOne, opts], [pkgTwo, dirTwo]] = (packDirectory as any).mock.calls;

      expect(logSpy).toHaveBeenCalledWith('preversion-root');
      expect(logSpy).toHaveBeenCalledWith('preversion-package-1');
      expect(logSpy).toHaveBeenCalledWith('version-package-1');

      // second argument to packDirectory() is the location, _not_ the contents
      expect(dirOne).toBe(pkgOne.location);
      expect(dirTwo).toBe(pkgTwo.location);

      expect(pkgOne.contents).toBe(path.join(pkgOne.location, 'dist'));
      expect(pkgTwo.contents).toBe(path.join(pkgTwo.location, 'dist'));

      // opts is a snapshot of npm-conf instance
      expect(packDirectory).toHaveBeenCalledWith(pkgOne, dirOne, opts);
      expect(packDirectory).toHaveBeenCalledWith(pkgTwo, dirTwo, opts);
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
          contents: path.join(cwd, 'packages/package-1/dist'),
        }),
        path.join(cwd, 'packages/package-1'),
        expect.any(Object)
      );
      expect(packDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'package-2',
          contents: path.join(cwd, 'packages/package-2'),
        }),
        path.join(cwd, 'packages/package-2'),
        expect.any(Object)
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
});
