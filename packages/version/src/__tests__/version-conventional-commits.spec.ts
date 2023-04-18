import { describe, expect, it, Mock, vi } from 'vitest';

// local modules _must_ be explicitly mocked
vi.mock('../lib/git-push', async () => await vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/is-anything-committed', async () => await vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => await vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => await vi.importActual('../lib/__mocks__/remote-branch-exists'));
vi.mock('../git-clients/gitlab-client', async () => await vi.importActual<any>('../__mocks__/gitlab-client'));
vi.mock('../conventional-commits', async () => await vi.importActual('../__mocks__/conventional-commits'));
vi.mock('write-pkg', async () => await vi.importActual('../lib/__mocks__/write-pkg'));

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  checkWorkingTree: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).checkWorkingTree,
  throwIfReleased: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfReleased,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));

import { dirname, join, resolve as pathResolve } from 'node:path';
import semver from 'semver';
import { fileURLToPath } from 'node:url';

// mocked modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import writePkg from 'write-pkg';
import { collectUpdates, VersionCommandOption } from '@lerna-lite/core';
import { recommendVersion, updateChangelog } from '../conventional-commits';

// helpers
import { initFixtureFactory, showCommit } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(pathResolve(__dirname, '../../../publish/src/__tests__'));

// test command
import { VersionCommand } from '../version-command';
import yargParser from 'yargs-parser';

const createArgv = (cwd, ...args) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as VersionCommandOption;
};

describe('--conventional-commits', () => {
  describe('independent', () => {
    const versionBumps = new Map([
      ['package-1', '1.0.1'],
      ['package-2', '2.1.0'],
      ['package-3', '4.0.0'],
      ['package-4', '4.1.0'],
      ['package-5', '5.0.1'],
    ]);

    const prereleaseVersionBumps = new Map([
      ['package-1', '1.0.1-alpha.0'],
      ['package-2', '2.1.0-alpha.0'],
      ['package-3', '4.0.0-beta.0'],
      ['package-4', '4.1.0-alpha.0'],
      ['package-5', '5.0.1-alpha.0'],
    ]);

    it('should use conventional-commits utility to guess version bump and generate CHANGELOG', async () => {
      versionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));

      const cwd = await initFixture('independent');

      await new VersionCommand(createArgv(cwd, '--conventional-commits'));

      const changedFiles = await showCommit(cwd, '--name-only');
      expect(changedFiles).toMatchSnapshot();

      versionBumps.forEach((version, name) => {
        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name }), 'independent', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          prereleaseId: undefined,
          buildMetadata: undefined,
        });
        expect(updateChangelog).toHaveBeenCalledWith(expect.objectContaining({ name, version }), 'independent', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          prereleaseId: undefined,
        });
      });
    });

    it('should guess prerelease version bumps and generate CHANGELOG', async () => {
      prereleaseVersionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));
      const cwd = await initFixture('prerelease-independent');

      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--conventional-prerelease'));

      const changedFiles = await showCommit(cwd, '--name-only');
      expect(changedFiles).toMatchSnapshot();

      prereleaseVersionBumps.forEach((version, name) => {
        const prereleaseId = (semver as any).prerelease(version)[0];
        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name }), 'independent', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          prereleaseId,
          buildMetadata: undefined,
        });
        expect(updateChangelog).toHaveBeenCalledWith(expect.objectContaining({ name, version }), 'independent', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
        });
      });
    });

    it('should call recommended version with conventionalBumpPrerelease set', async () => {
      prereleaseVersionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));
      const cwd = await initFixture('prerelease-independent');

      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--conventional-prerelease', '--conventional-bump-prerelease'));

      prereleaseVersionBumps.forEach((version, name) => {
        const prereleaseId = (semver as any).prerelease(version)[0];
        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name }), 'independent', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          prereleaseId,
          conventionalBumpPrerelease: true,
        });
        expect(updateChangelog).toHaveBeenCalledWith(expect.objectContaining({ name, version }), 'independent', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
        });
      });
    });

    it('should graduate prerelease version bumps and generate CHANGELOG', async () => {
      versionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));
      const cwd = await initFixture('prerelease-independent');

      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--conventional-graduate'));

      const changedFiles = await showCommit(cwd, '--name-only');
      expect(changedFiles).toMatchSnapshot();

      versionBumps.forEach((version, name) => {
        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name }), 'independent', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          prerelease: undefined,
          buildMetadata: undefined,
        });
        expect(updateChangelog).toHaveBeenCalledWith(expect.objectContaining({ name, version }), 'independent', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
        });
      });
    });

    it('throws when --conventional-prerelease is used with an argument that returns nothing to prerelease', async () => {
      prereleaseVersionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));
      const cwd = await initFixture('prerelease-independent');

      const command = new VersionCommand(createArgv(cwd, '--conventional-commits', '--conventional-prerelease', 'premajor'));

      await expect(command).rejects.toThrow('No packages found to prerelease when using "--conventional-prerelease premajor".');
    });

    it('accepts --changelog-preset option', async () => {
      const cwd = await initFixture('independent');
      const changelogOpts = {
        changelogPreset: 'foo-bar',
        rootPath: cwd,
        tagPrefix: 'v',
        prereleaseId: undefined,
        buildMetadata: undefined,
      };

      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--changelog-preset', 'foo-bar'));

      expect(recommendVersion).toHaveBeenCalledWith(expect.any(Object), 'independent', changelogOpts);
      expect(updateChangelog).toHaveBeenCalledWith(expect.any(Object), 'independent', changelogOpts);
    });

    it('should not update changelogs with --no-changelog option', async () => {
      const cwd = await initFixture('independent');
      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--no-changelog'));

      expect(updateChangelog).not.toHaveBeenCalled();
    });

    it('should respect --no-private', async () => {
      const cwd = await initFixture('independent');
      // TODO: (major) make --no-private the default
      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--no-private'));

      const changedFiles = await showCommit(cwd, '--name-only');
      expect(changedFiles).not.toContain('package-5');
    });

    it('accepts --build-metadata option', async () => {
      const buildMetadata = '001';
      versionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(`${bump}+${buildMetadata}`));
      const cwd = await initFixture('independent');

      const changelogOpts = {
        changelogPreset: undefined,
        rootPath: cwd,
        tagPrefix: 'v',
        prereleaseId: undefined,
      };

      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--build-metadata', buildMetadata));

      const changedFiles = await showCommit(cwd, '--name-only');
      expect(changedFiles).toMatchSnapshot();

      expect(recommendVersion).toHaveBeenCalledWith(expect.any(Object), 'independent', {
        ...changelogOpts,
        buildMetadata,
      });
      expect(updateChangelog).toHaveBeenCalledWith(expect.any(Object), 'independent', changelogOpts);
    });
  });

  describe('fixed mode', () => {
    it('should use conventional-commits utility to guess version bump and generate CHANGELOG', async () => {
      (recommendVersion as any)
        .mockResolvedValueOnce('1.0.1')
        .mockResolvedValueOnce('1.1.0')
        .mockResolvedValueOnce('2.0.0')
        .mockResolvedValueOnce('1.1.0')
        .mockResolvedValueOnce('1.0.0');

      const cwd = await initFixture('normal');

      await new VersionCommand(createArgv(cwd, '--conventional-commits'));

      const changedFiles = await showCommit(cwd, '--name-only');
      expect(changedFiles).toMatchSnapshot();

      ['package-1', 'package-2', 'package-3', 'package-4', 'package-5'].forEach((name) => {
        const location = join(cwd, 'packages', name);

        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name, location }), 'fixed', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          prereleaseId: undefined,
          buildMetadata: undefined,
        });

        expect(updateChangelog).toHaveBeenCalledWith(expect.objectContaining({ name, version: '2.0.0' }), 'fixed', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          prereleaseId: undefined,
        });
      });

      expect(updateChangelog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'normal',
          location: cwd,
        }),
        'root',
        {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          version: '2.0.0',
          prereleaseId: undefined,
        }
      );
    });

    it('should guess prerelease version bumps and generate CHANGELOG', async () => {
      (recommendVersion as any)
        .mockResolvedValueOnce('1.0.1-alpha.0')
        .mockResolvedValueOnce('1.1.0-alpha.0')
        .mockResolvedValueOnce('2.0.0-alpha.0')
        .mockResolvedValueOnce('1.1.0-alpha.0')
        .mockResolvedValueOnce('1.0.0-alpha.0');

      const cwd = await initFixture('normal');

      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--conventional-prerelease'));

      const changedFiles = await showCommit(cwd, '--name-only');
      expect(changedFiles).toMatchSnapshot();

      ['package-1', 'package-2', 'package-3', 'package-4', 'package-5'].forEach((name) => {
        const location = join(cwd, 'packages', name);

        expect(recommendVersion).toHaveBeenCalledWith(expect.objectContaining({ name, location }), 'fixed', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          prereleaseId: 'alpha',
          buildMetadata: undefined,
        });

        expect(updateChangelog).toHaveBeenCalledWith(expect.objectContaining({ name, version: '2.0.0-alpha.0' }), 'fixed', {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
        });
      });

      expect(updateChangelog).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'normal',
          location: cwd,
        }),
        'root',
        {
          changelogPreset: undefined,
          rootPath: cwd,
          tagPrefix: 'v',
          version: '2.0.0-alpha.0',
          prereleaseId: undefined,
        }
      );
    });

    it('accepts --changelog-preset option', async () => {
      const cwd = await initFixture('normal');
      const changelogOpts = {
        changelogPreset: 'baz-qux',
        rootPath: cwd,
        tagPrefix: 'dragons-are-awesome',
        prereleaseId: undefined,
      };

      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--changelog-preset', 'baz-qux', '--tag-version-prefix', 'dragons-are-awesome'));

      expect(recommendVersion).toHaveBeenCalledWith(expect.any(Object), 'fixed', {
        ...changelogOpts,
        buildMetadata: undefined,
      });
      expect(updateChangelog).toHaveBeenCalledWith(expect.any(Object), 'fixed', changelogOpts);
    });

    it('should not update changelogs with --no-changelog option', async () => {
      const cwd = await initFixture('normal');
      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--no-changelog'));

      expect(updateChangelog).not.toHaveBeenCalled();
    });

    it('should respect --no-private', async () => {
      const cwd = await initFixture('normal');
      // TODO: (major) make --no-private the default
      await new VersionCommand(createArgv(cwd, '--conventional-commits', '--no-private'));

      const changedFiles = await showCommit(cwd, '--name-only');
      expect(changedFiles).not.toContain('package-5');
    });
  });

  it('avoids duplicating previously-released version', async () => {
    const cwd = await initFixture('no-interdependencies');

    (collectUpdates as any).setUpdated(cwd, 'package-1');
    (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

    await new VersionCommand(createArgv(cwd, '--conventional-commits'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-1': '1.1.0',
    });

    // clear previous publish mock records
    vi.clearAllMocks();
    (writePkg as any).registry.clear();

    (collectUpdates as any).setUpdated(cwd, 'package-2');
    (recommendVersion as Mock).mockImplementationOnce((pkg) => Promise.resolve((semver as any).inc(pkg.version, 'patch')));

    await new VersionCommand(createArgv(cwd, '--conventional-commits'));

    expect((writePkg as any).updatedVersions()).toEqual({
      'package-2': '1.1.1',
    });
  });

  it('accepts --build-metadata option', async () => {
    const buildMetadata = 'exp.sha.5114f85';
    (recommendVersion as Mock).mockResolvedValueOnce(`1.0.1+${buildMetadata}`);
    const cwd = await initFixture('normal');

    const changelogOpts = {
      changelogPreset: undefined,
      rootPath: cwd,
      tagPrefix: 'v',
      prereleaseId: undefined,
    };

    await new VersionCommand(createArgv(cwd, '--conventional-commits', '--build-metadata', buildMetadata));

    const changedFiles = await showCommit(cwd, '--name-only');
    expect(changedFiles).toMatchSnapshot();

    expect(recommendVersion).toHaveBeenCalledWith(expect.any(Object), 'fixed', {
      ...changelogOpts,
      buildMetadata,
    });
    expect(updateChangelog).toHaveBeenCalledWith(expect.any(Object), 'fixed', changelogOpts);
  });
});
