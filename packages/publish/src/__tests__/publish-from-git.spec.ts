import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logOutput, promptConfirmation, throwIfUncommitted, type PublishCommandOption } from '@lerna-lite/core';
import { gitTag, initFixtureFactory, stripAnsi } from '@lerna-test/helpers';
import { loggingOutput } from '@lerna-test/helpers/logging-output.js';
import { describe, expect, it, vi, type Mock } from 'vitest';
import yargParser from 'yargs-parser';

import type { npmPublish as npmPublishMock } from '../lib/__mocks__/npm-publish.js';
import { npmPublish } from '../lib/npm-publish.js';
import { PublishCommand } from '../publish-command.js';

vi.mock('write-package', async () => await vi.importActual('../../../version/src/lib/__mocks__/write-package'));

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual('../../../version/src/lib/__mocks__/git-push'));
vi.mock(
  '../../../version/src/lib/is-anything-committed',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/is-anything-committed')
);
vi.mock('../../../version/src/lib/is-behind-upstream', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-behind-upstream'));
vi.mock(
  '../../../version/src/lib/remote-branch-exists',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/remote-branch-exists')
);

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  pulseTillDone: (await vi.importActual<any>('../../../core/src/utils/pulse-till-done')).pulseTillDone,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  getOneTimePassword: () => Promise.resolve('654321'),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));

// local modules _must_ be explicitly mocked
vi.mock('../lib/get-packages-without-license', async () => await vi.importActual('../lib/__mocks__/get-packages-without-license'));
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock('../lib/get-two-factor-auth-required', async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required'));
vi.mock('../lib/get-unpublished-packages', async () => await vi.importActual('../lib/__mocks__/get-unpublished-packages'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('publish');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as PublishCommandOption;
};

describe('publish from-git', () => {
  it('publishes tagged packages', async () => {
    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    await new PublishCommand(createArgv(cwd, '--bump', 'from-git'));

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
    expect((logOutput as any).logged()).toMatch('Found 4 packages to publish:');
    expect((npmPublish as typeof npmPublishMock).order()).toEqual([
      'package-1',
      'package-4',
      'package-2',
      'package-3',
      // package-5 is private
    ]);
  });

  it('publishes tagged packages that includes workspace in the name prefix', async () => {
    const cwd = await initFixture('normal-workspace-name-prefixed');

    await gitTag(cwd, 'v1.0.0');
    await new PublishCommand(createArgv(cwd, '--bump', 'from-git', '--cleanup-temp-files'));

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
    expect((logOutput as any).logged()).toMatch('Found 4 packages to publish:');
    expect((npmPublish as typeof npmPublishMock).order()).toEqual([
      '@my-workspace/package-1',
      '@my-workspace/package-4',
      '@my-workspace/package-2',
      '@my-workspace/package-3',
      // @my-workspace/package-5 is private
    ]);

    // check that @my-workspace/package-1 is properly escaped in the tarball tgz name
    expect(npmPublish).toHaveBeenCalledWith(
      expect.objectContaining({ name: '@my-workspace/package-1', version: '1.0.0' }),
      expect.stringContaining('my-workspace-package-1-1.0.0.tgz'),
      expect.any(Object),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('publishes tagged packages in dry-run mode', async () => {
    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    await new PublishCommand(createArgv(cwd, '--bump', 'from-git', '--dry-run'));

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    expect(stripAnsi((promptConfirmation as Mock).mock.lastCall![0])).toBe('[dry-run] Are you sure you want to publish these packages?');
    expect((logOutput as any).logged()).toMatch('Found 4 packages to publish:');
    expect((npmPublish as typeof npmPublishMock).order()).toEqual([
      'package-1',
      'package-4',
      'package-2',
      'package-3',
      // package-5 is private
    ]);
  });

  it('publishes tagged packages, lexically sorted when --no-sort is present', async () => {
    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    await new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
    expect((logOutput as any).logged()).toMatch('Found 4 packages to publish:');
    expect((npmPublish as typeof npmPublishMock).order()).toEqual([
      'package-1',
      'package-2',
      'package-3',
      'package-4',
      // package-5 is private
    ]);
  });

  it('publishes tagged independent packages', async () => {
    const cwd = await initFixture('independent');

    await Promise.all([
      gitTag(cwd, 'package-1@1.0.0'),
      gitTag(cwd, 'package-2@2.0.0'),
      gitTag(cwd, 'package-3@3.0.0'),
      gitTag(cwd, 'package-4@4.0.0'),
      gitTag(cwd, 'package-5@5.0.0'),
    ]);
    await new PublishCommand(createArgv(cwd, '--bump', 'from-git'));

    expect((npmPublish as typeof npmPublishMock).order()).toEqual([
      'package-1',
      'package-4',
      'package-2',
      'package-3',
      // package-5 is private
    ]);
  });

  it('publishes packages matching custom --tag-version-prefix', async () => {
    const cwd = await initFixture('normal');

    await gitTag(cwd, 'foo/1.0.0');
    await new PublishCommand(createArgv(cwd, '--bump', 'from-git', '--tag-version-prefix', 'foo/'));

    expect((npmPublish as typeof npmPublishMock).order()).toEqual([
      'package-1',
      'package-4',
      'package-2',
      'package-3',
      // package-5 is private
    ]);
  });

  it('only publishes independent packages with matching tags', async () => {
    const cwd = await initFixture('independent');

    await gitTag(cwd, 'package-3@3.0.0');
    await new PublishCommand(createArgv(cwd, '--bump', 'from-git'));

    expect((logOutput as any).logged()).toMatch('Found 1 package to publish:');
    expect((npmPublish as typeof npmPublishMock).order()).toEqual(['package-3']);
  });

  it('exits early when the current commit is not tagged', async () => {
    const cwd = await initFixture('normal');

    await new PublishCommand(createArgv(cwd, '--bump', 'from-git'));

    expect(npmPublish).not.toHaveBeenCalled();

    const logMessages = loggingOutput('info');
    expect(logMessages).toContain('No tagged release found. You might not have fetched tags.');
  });

  it('throws an error when uncommitted changes are present', async () => {
    (throwIfUncommitted as Mock).mockImplementationOnce(() => {
      throw new Error('uncommitted');
    });

    const cwd = await initFixture('normal');
    const command = new PublishCommand(createArgv(cwd, '--bump', 'from-git'));

    await expect(command).rejects.toThrow('uncommitted');
    // notably different than the actual message, but good enough here
  });

  it('throws an error when --git-head is passed', async () => {
    const cwd = await initFixture('normal');
    const command = new PublishCommand(createArgv(cwd, '--bump', 'from-git', '--git-head', 'deadbeef'));

    await expect(command).rejects.toThrow(
      expect.objectContaining({
        prefix: 'EGITHEAD',
      })
    );
  });

  it('should throw even when npm publish throws any other type of errors from a previous half publish process', async () => {
    vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);
    (npmPublish as Mock).mockImplementationOnce(() => {
      return Promise.reject({ code: 'UNAUTHORIZED' });
    });

    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    const command = new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    await expect(command).rejects.toEqual({ code: 'UNAUTHORIZED', name: 'ValidationError' });
    expect(process.exitCode).toBe(1);
    const logMessages = loggingOutput('notice');
    expect(logMessages).toContain('Package failed to publish: package-1');

    // reset exit code
    process.exitCode = undefined;
  });

  it('should not throw and assume package is already published on npmjs.com registry when npm publish throws EPUBLISHCONFLICT from a previous half publish process', async () => {
    (npmPublish as Mock).mockImplementation(() => {
      const ex = new Error('Mocked npm publish fail') as Error & { code: string };
      ex.code = 'EPUBLISHCONFLICT';
      return Promise.reject(ex);
    });

    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    const command = new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    await expect(command).resolves.toBeUndefined();

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    // since all packages rejected with publish conflict, we should have the "All published" message when recalling execute()
    await command.initialize();
    const loggerSpy = vi.spyOn(command.logger, 'success');
    await command.execute();
    expect(loggerSpy).toHaveBeenCalledWith('All packages have already been published.');
  });

  it('should not throw and assume package is already published on npmjs.com registry when npm publish throws error E403 with message "You cannot publish over the previously published versions" from a previous half publish process', async () => {
    (npmPublish as Mock).mockImplementation(() => {
      const ex = new Error('You cannot publish over the previously published versions') as Error & { code: string };
      ex.code = 'E403';
      return Promise.reject(ex);
    });

    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    const command = new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    await expect(command).resolves.toBeUndefined();

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    // since all packages rejected with publish conflict, we should have the "All published" message when recalling execute()
    await command.initialize();
    const loggerSpy = vi.spyOn(command.logger, 'success');
    await command.execute();
    expect(loggerSpy).toHaveBeenCalledWith('All packages have already been published.');
  });

  it('should not throw and assume package is already published on npmjs.com registry when npm publish throws error E409 with message "Failed to save packument"', async () => {
    (npmPublish as Mock).mockImplementation(() => {
      const ex = new Error('Failed to save packument') as Error & { code: string };
      ex.code = 'E409';
      return Promise.reject(ex);
    });

    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    const command = new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    await expect(command).resolves.toBeUndefined();

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    // since all packages rejected with publish conflict, we should have the "All published" message when recalling execute()
    await command.initialize();
    const loggerSpy = vi.spyOn(command.logger, 'success');
    await command.execute();
    expect(loggerSpy).toHaveBeenCalledWith('All packages have already been published.');
  });

  it('should not throw and assume package is already published on GitHub npm Registry when npm publish throws E409 from a previous half publish process', async () => {
    (npmPublish as Mock).mockImplementation(() => {
      const ex = new Error('Mocked npm publish fail') as Error & { code: string };
      ex.code = 'E409';
      return Promise.reject(ex);
    });

    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    const command = new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    await expect(command).resolves.toBeUndefined();

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    // since all packages rejected with publish conflict, we should have the "All published" message when recalling execute()
    await command.initialize();
    const loggerSpy = vi.spyOn(command.logger, 'success');
    await command.execute();
    expect(loggerSpy).toHaveBeenCalledWith('All packages have already been published.');
  });

  it('should not throw and assume package is already published on GitHub npm Registry when npm publish throws "409 Conflict - PUT https://npm.pkg.github.com" from a previous half publish process', async () => {
    (npmPublish as Mock).mockImplementation(() => {
      const ex = new Error('409 Conflict - PUT https://npm.pkg.github.com/');
      return Promise.reject(ex);
    });

    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    const command = new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    await expect(command).resolves.toBeUndefined();

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    // since all packages rejected with publish conflict, we should have the "All published" message when recalling execute()
    await command.initialize();
    const loggerSpy = vi.spyOn(command.logger, 'success');
    await command.execute();
    expect(loggerSpy).toHaveBeenCalledWith('All packages have already been published.');
  });

  it('should not throw and assume package is already published on GitHub npm Registry when npm publish throws "Cannot publish over existing version" from a previous half publish process', async () => {
    (npmPublish as Mock).mockImplementation(() => {
      const ex = new Error('some unrelated error message because we want detection based on ex.body.error') as Error & {
        body: { error: string };
      };
      ex.body = { error: 'Cannot publish over existing version' };
      return Promise.reject(ex);
    });

    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    const command = new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    await expect(command).resolves.toBeUndefined();

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    // since all packages rejected with publish conflict, we should have the "All published" message when recalling execute()
    await command.initialize();
    const loggerSpy = vi.spyOn(command.logger, 'success');
    await command.execute();
    expect(loggerSpy).toHaveBeenCalledWith('All packages have already been published.');
  });

  it('should re-throw when npm publish throws not related to npmjs/github version conflict', async () => {
    (npmPublish as Mock).mockImplementation(() => {
      const ex = new Error('The milk was spilt.');
      return Promise.reject(ex);
    });

    const cwd = await initFixture('normal');

    await gitTag(cwd, 'v1.0.0');
    const command = new PublishCommand(createArgv(cwd, 'from-git', '--no-sort'));

    await expect(command).rejects.toBeTruthy();
  });
});
