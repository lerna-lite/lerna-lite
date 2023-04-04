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
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  getOneTimePassword: () => Promise.resolve('654321'),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));
vi.mock('@lerna-lite/version', async () => await vi.importActual('../../../version/src/version-command'));

// local modules _must_ be explicitly mocked
vi.mock('../lib/get-packages-without-license', async () => await vi.importActual('../lib/__mocks__/get-packages-without-license'));
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock('../lib/get-two-factor-auth-required', async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required'));
vi.mock('../lib/get-unpublished-packages', async () => await vi.importActual('../lib/__mocks__/get-unpublished-packages'));
vi.mock('../lib/pack-directory', async () => await vi.importActual('../lib/__mocks__/pack-directory'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));

import { remove } from 'fs-extra/esm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mock } from 'vitest';
import yargParser from 'yargs-parser';

// mocked or stubbed modules
import writePkg from 'write-pkg';
import { npmPublish } from '../lib/npm-publish';
import { npmPublish as npmPublishMock } from '../lib/__mocks__/npm-publish';
import { logOutput, promptConfirmation, PublishCommandOption, throwIfUncommitted } from '@lerna-lite/core';
import { getUnpublishedPackages } from '../lib/get-unpublished-packages';

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import { initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(__dirname);

// file under test
import { PublishCommand } from '../publish-command';

const createArgv = (cwd, ...args) => {
  args.unshift('publish');
  if (args.length > 0 && args[1] && args[1].length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as PublishCommandOption;
};

describe('publish from-package', () => {
  it('publishes unpublished packages', async () => {
    const cwd = await initFixture('normal');

    (getUnpublishedPackages as Mock).mockImplementationOnce((packageGraph) => {
      const pkgs = packageGraph.rawPackageList.slice(1, 3);
      return pkgs.map((pkg) => packageGraph.get(pkg.name));
    });

    await new PublishCommand(createArgv(cwd, '--bump', 'from-package'));

    expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
    expect((logOutput as any).logged()).toMatch('Found 2 packages to publish:');
    expect((npmPublish as typeof npmPublishMock).order()).toEqual(['package-2', 'package-3']);
  });

  it('publishes unpublished packages in dry-run mode', async () => {
    const cwd = await initFixture('normal');

    (getUnpublishedPackages as Mock).mockImplementationOnce((packageGraph) => {
      const pkgs = packageGraph.rawPackageList.slice(1, 3);
      return pkgs.map((pkg) => packageGraph.get(pkg.name));
    });

    await new PublishCommand(createArgv(cwd, '--bump', 'from-package', '--dry-run'));

    expect(promptConfirmation).toHaveBeenLastCalledWith('[dry-run] Are you sure you want to publish these packages?');
    expect((logOutput as any).logged()).toMatch('Found 2 packages to publish:');
    expect((npmPublish as typeof npmPublishMock).order()).toEqual(['package-2', 'package-3']);
  });

  it('publishes unpublished independent packages', async () => {
    const cwd = await initFixture('independent');

    (getUnpublishedPackages as Mock).mockImplementationOnce((packageGraph) => Array.from(packageGraph.values()));

    await new PublishCommand(createArgv(cwd, 'from-package'));

    expect((npmPublish as typeof npmPublishMock).order()).toEqual([
      'package-1',
      'package-4',
      'package-2',
      'package-3',
      // package-5 is private
    ]);
  });

  it('publishes unpublished independent packages, lexically sorted when --no-sort is present', async () => {
    const cwd = await initFixture('independent');

    (getUnpublishedPackages as Mock).mockImplementationOnce((packageGraph) => Array.from(packageGraph.values()));

    await new PublishCommand(createArgv(cwd, 'from-package', '--no-sort'));

    expect((npmPublish as typeof npmPublishMock).order()).toEqual([
      'package-1',
      'package-2',
      'package-3',
      'package-4',
      // package-5 is private
    ]);
  });

  it('exits early when all packages are published', async () => {
    const cwd = await initFixture('normal');

    await new PublishCommand(createArgv(cwd, 'from-package'));

    expect(npmPublish).not.toHaveBeenCalled();

    const logMessages = loggingOutput('notice');
    expect(logMessages).toContain('No unpublished release found');
  });

  it('throws an error when uncommitted changes are present', async () => {
    (throwIfUncommitted as Mock).mockImplementationOnce(() => {
      throw new Error('uncommitted');
    });

    const cwd = await initFixture('normal');
    const command = new PublishCommand(createArgv(cwd, 'from-package'));

    await expect(command).rejects.toThrow('uncommitted');
    // notably different than the actual message, but good enough here
  });

  it('does not require a git repo', async () => {
    (getUnpublishedPackages as Mock).mockImplementationOnce((packageGraph) => [packageGraph.get('package-1')]);

    const cwd = await initFixture('independent');

    // nuke the git repo first
    await remove(join(cwd, '.git'));
    await new PublishCommand(createArgv(cwd, 'from-package'));

    expect(npmPublish).toHaveBeenCalled();
    expect((writePkg as any).updatedManifest('package-1')).not.toHaveProperty('gitHead');

    const logMessages = loggingOutput('notice');
    expect(logMessages).toContain('Unable to verify working tree, proceed at your own risk');
    expect(logMessages).toContain('Unable to set temporary gitHead property, it will be missing from registry metadata');
    expect(logMessages).toContain("Unable to reset working tree changes, this probably isn't a git repo.");
  });

  it('accepts --git-head override', async () => {
    (getUnpublishedPackages as Mock).mockImplementationOnce((packageGraph) => [packageGraph.get('package-1')]);

    const cwd = await initFixture('independent');

    await new PublishCommand(createArgv(cwd, 'from-package', '--git-head', 'deadbeef'));

    expect(npmPublish).toHaveBeenCalled();
    expect((writePkg as any).updatedManifest('package-1').gitHead).toBe('deadbeef');
  });
});
