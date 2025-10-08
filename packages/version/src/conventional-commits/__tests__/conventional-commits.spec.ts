import { dirname, join, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Project } from '@lerna-lite/core';
// helpers
import { gitAdd, gitCommit, gitTag, initFixtureFactory } from '@lerna-test/helpers';
import { readFile } from 'fs/promises';
import { beforeEach, describe, expect, it, test } from 'vitest';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

// file under test
import { Package } from '@lerna-lite/core';
// stabilize changelog commit SHA and datestamp
import serializeChangelog from '@lerna-test/helpers/serializers/serialize-changelog.js';

import { applyBuildMetadata } from '../../conventional-commits/apply-build-metadata.js';
import { recommendVersion } from '../../conventional-commits/recommend-version.js';
import { updateChangelog } from '../../conventional-commits/update-changelog.js';
import { GetChangelogConfig } from '../get-changelog-config.js';
expect.addSnapshotSerializer(serializeChangelog);

describe('conventional-commits', () => {
  describe('recommendVersion()', () => {
    it('returns next version bump', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'feat: changed 1');

      const bump = await recommendVersion(pkg1, 'fixed', {} as any);
      expect(bump).toBe('1.1.0');
    });

    it('returns next version bump with buildMetadata', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'feat: changed 1');

      const bump = await recommendVersion(pkg1, 'fixed', { buildMetadata: '001' });
      expect(bump).toBe('1.1.0+001');
    });

    it('returns next version prerelease bump with prereleaseId', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'feat: changed 1');

      const bump = await recommendVersion(pkg1, 'fixed', { prereleaseId: 'alpha' } as any);
      expect(bump).toBe('1.1.0-alpha.0');
    });

    it('returns next version prerelease bump with prereleaseId and buildMetadata', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'feat: changed 1');

      const bump = await recommendVersion(pkg1, 'fixed', {
        prereleaseId: 'alpha',
        buildMetadata: '21AF26D3--117B344092BD',
      });
      expect(bump).toBe('1.1.0-alpha.0+21AF26D3--117B344092BD');
    });

    it('returns package-specific bumps in independent mode', async () => {
      const cwd = await initFixture('independent');
      const [pkg1, pkg2] = await Project.getPackages(cwd);
      const opts = { changelogPreset: 'angular' };

      // make a change in package-1 and package-2
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: changed 1');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'feat: changed 2');

      const [bump1, bump2] = await Promise.all([recommendVersion(pkg1, 'independent', opts), recommendVersion(pkg2, 'independent', opts)]);
      expect(bump1).toBe('1.0.1');
      expect(bump2).toBe('1.1.0');
    });

    it('returns package-specific bumps in independent mode with buildMetadata', async () => {
      const cwd = await initFixture('independent');
      const [pkg1, pkg2] = await Project.getPackages(cwd);
      const opts = { buildMetadata: '20130313144700' };

      // make a change in package-1 and package-2
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: changed 1');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'feat: changed 2');

      const [bump1, bump2] = await Promise.all([recommendVersion(pkg1, 'independent', opts), recommendVersion(pkg2, 'independent', opts)]);
      expect(bump1).toBe('1.0.1+20130313144700');
      expect(bump2).toBe('1.1.0+20130313144700');
    });

    it('returns package-specific prerelease bumps in independent mode with prereleaseId', async () => {
      const cwd = await initFixture('independent');
      const [pkg1, pkg2] = await Project.getPackages(cwd);
      const opts = { changelogPreset: 'angular' };

      // make a change in package-1 and package-2
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: changed 1');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'feat: changed 2');

      const [bump1, bump2] = await Promise.all([
        recommendVersion(pkg1, 'independent', Object.assign(opts, { prereleaseId: 'alpha' })),
        recommendVersion(pkg2, 'independent', Object.assign(opts, { prereleaseId: 'beta' })),
      ]);
      expect(bump1).toBe('1.0.1-alpha.0');
      expect(bump2).toBe('1.1.0-beta.0');
    });

    it('returns package-specific version bumps from prereleases with prereleaseId', async () => {
      const cwd = await initFixture('prerelease-independent');
      const [pkg1, pkg2, pkg3] = await Project.getPackages(cwd);
      const opts = { changelogPreset: 'angular' };

      // make a change in package-1, package-2 and package-3
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();
      await pkg3.set('changed', 3).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: changed 1');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'feat: changed 2');

      await gitAdd(cwd, pkg3.manifestLocation);
      await gitCommit(cwd, 'feat!: changed\n\nBREAKING CHANGE: changed');

      const [bump1, bump2, bump3] = await Promise.all([
        recommendVersion(pkg1, 'independent', Object.assign(opts, { prereleaseId: 'alpha', conventionalBumpPrerelease: true })),
        recommendVersion(pkg2, 'independent', Object.assign(opts, { prereleaseId: 'beta', conventionalBumpPrerelease: true })),
        recommendVersion(pkg3, 'independent', Object.assign(opts, { prereleaseId: 'beta', conventionalBumpPrerelease: true })),
      ]);

      // all versions should be bumped
      expect(bump1).toBe('1.0.1-alpha.0');
      expect(bump2).toBe('1.1.0-beta.0');
      expect(bump3).toBe('2.0.0-beta.0');
    });

    it('returns package-specific prerelease bumps from prereleases with prereleaseId', async () => {
      const cwd = await initFixture('prerelease-independent');
      const [pkg1, pkg2, pkg3] = await Project.getPackages(cwd);
      const opts = { changelogPreset: 'angular' };

      // make a change in package-1, package-2 and package-3
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();
      await pkg3.set('changed', 3).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: changed 1');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'feat: changed 2');

      await gitAdd(cwd, pkg3.manifestLocation);
      await gitCommit(cwd, 'feat!: changed\n\nBREAKING CHANGE: changed');

      const [bump1, bump2, bump3] = await Promise.all([
        recommendVersion(pkg1, 'independent', Object.assign(opts, { prereleaseId: 'alpha' })),
        recommendVersion(pkg2, 'independent', Object.assign(opts, { prereleaseId: 'beta' })),
        recommendVersion(pkg3, 'independent', Object.assign(opts, { prereleaseId: 'beta' })),
      ]);

      // we just have a bump in the prerelease
      expect(bump1).toBe('1.0.0-alpha.1');
      expect(bump2).toBe('1.0.0-beta.1');
      expect(bump3).toBe('1.0.0-beta.1');
    });

    it('falls back to patch bumps for non-bumping commit types', async () => {
      const cwd = await initFixture('independent');
      const [pkg1, pkg2] = await Project.getPackages(cwd);
      const opts = {
        // sometimes presets return null for the level, with no actual releaseType...
        changelogPreset: pathResolve(__dirname, '../__fixtures__/fixed/scripts/null-preset.ts'),
      };

      // make a change in package-1 and package-2
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: changed 1');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'chore: changed 2');

      const [bump1, bump2] = await Promise.all([recommendVersion(pkg1, 'independent', opts), recommendVersion(pkg2, 'independent', opts)]);
      expect(bump1).toBe('1.0.1');
      expect(bump2).toBe('1.0.1');
    });

    it('supports local preset paths', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'feat: changed 1');

      const bump = await recommendVersion(pkg1, 'fixed', {
        changelogPreset: './scripts/local-preset.ts',
      });
      expect(bump).toBe('1.1.0');
    });

    it('supports async function presets', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'feat: changed 1');

      const bump = await recommendVersion(pkg1, 'fixed', {
        changelogPreset: './scripts/local-preset-async.js',
      });
      expect(bump).toBe('1.1.0');
    });

    it('supports custom tagPrefix in fixed mode', async () => {
      const cwd = await initFixture('fixed');

      await gitTag(cwd, 'dragons-are-awesome1.0.0');

      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: changed 1');

      const bump = await recommendVersion(pkg1, 'fixed', {
        tagPrefix: 'dragons-are-awesome',
      });
      expect(bump).toBe('1.0.1');
    });

    it('propagates errors from callback', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      await expect(
        recommendVersion(pkg1, 'fixed', {
          changelogPreset: './scripts/erroring-preset.ts',
        })
      ).rejects.toThrow('`whatBump` must be a function');
    });

    it('throws an error when an implicit changelog preset cannot be loaded', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      await expect(
        recommendVersion(pkg1, 'fixed', {
          changelogPreset: 'garbage',
        })
      ).rejects.toThrow('Unable to load conventional-changelog preset "garbage" (conventional-changelog-garbage)');
    });

    it('throws an error when an implicit changelog preset with scope cannot be loaded', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      await expect(
        recommendVersion(pkg1, 'fixed', {
          changelogPreset: '@scope/garbage',
        })
      ).rejects.toThrow('preset "@scope/garbage" (@scope/conventional-changelog-garbage)');
    });

    it('throws an error when an implicit changelog preset with scoped subpath cannot be loaded', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      await expect(
        recommendVersion(pkg1, 'fixed', {
          changelogPreset: '@scope/garbage/pail',
        })
      ).rejects.toThrow('preset "@scope/garbage/pail" (@scope/conventional-changelog-garbage/pail)');
    });

    it('throws an error when an explicit changelog preset cannot be loaded', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      await expect(
        recommendVersion(pkg1, 'fixed', {
          changelogPreset: 'conventional-changelog-garbage',
        })
      ).rejects.toThrow('Unable to load conventional-changelog preset "conventional-changelog-garbage"');
    });

    it('throws an error when an explicit changelog preset with subpath cannot be loaded', async () => {
      const cwd = await initFixture('fixed');
      const [pkg1] = await Project.getPackages(cwd);

      await expect(
        recommendVersion(pkg1, 'fixed', {
          changelogPreset: 'conventional-changelog-garbage/pail',
        })
      ).rejects.toThrow('Unable to load conventional-changelog preset "conventional-changelog-garbage/pail"');
    });

    describe('bump for major version zero', () => {
      it('treats breaking changes as semver-minor', async () => {
        const cwd = await initFixture('major-zero');
        const [pkg0] = await Project.getPackages(cwd);

        // make a change in package-0
        await pkg0.set('changed', 1).serialize();
        await gitAdd(cwd, pkg0.manifestLocation);
        await gitCommit(cwd, 'feat: changed\n\nBREAKING CHANGE: changed');

        const bump = await recommendVersion(pkg0, 'independent', {});
        expect(bump).toBe('0.2.0');
      });
    });

    describe('prerelease bumps', () => {
      let cwd: string;
      let pkg: Package;
      let opts: any;
      let recommend: any;

      beforeEach(async () => {
        let value = 0;
        cwd = await initFixture('independent');
        [pkg] = await Project.getPackages(cwd);
        opts = { changelogPreset: 'angular' };
        recommend = async (commitMessage: string, { initVersion } = {} as any) => {
          if (initVersion) {
            await pkg.set('version', initVersion).serialize();
            await gitAdd(cwd, pkg.manifestLocation);
            await gitCommit(cwd, commitMessage);
          }
          await pkg.set('changed', (value += 1)).serialize();
          await gitAdd(cwd, pkg.manifestLocation);
          await gitCommit(cwd, commitMessage);
          return recommendVersion(pkg, 'independent', Object.assign(opts, { prereleaseId: 'beta' }));
        };
      });

      it('stable + fix/minor/major => prepatch/preminor/premajor', async () => {
        // default initial version is '1.0.0'
        expect(await recommend('fix: changed')).toBe('1.0.1-beta.0');
        expect(await recommend('feat: changed')).toBe('1.1.0-beta.0');
        expect(await recommend('feat: changed\n\nBREAKING CHANGE: changed')).toBe('2.0.0-beta.0');
      });

      it('prepatch + fix/minor/major => prerelease/preminor/premajor', async () => {
        expect(await recommend('fix: changed', { initVersion: '1.0.1-beta.0' })).toBe('1.0.1-beta.1');
        expect(await recommend('feat: changed')).toBe('1.1.0-beta.0');
        expect(await recommend('feat: changed\n\nBREAKING CHANGE: changed')).toBe('2.0.0-beta.0');
      });

      it('preminor + fix/minor/major => prerelease/prerelease/premajor', async () => {
        expect(await recommend('fix: changed', { initVersion: '1.1.0-beta.0' })).toBe('1.1.0-beta.1');
        expect(await recommend('feat: changed')).toBe('1.1.0-beta.1');
        expect(await recommend('feat: changed\n\nBREAKING CHANGE: changed')).toBe('2.0.0-beta.0');
      });

      it('premajor + fix/minor/major => prerelease', async () => {
        expect(await recommend('fix: changed', { initVersion: '2.0.0-beta.0' })).toBe('2.0.0-beta.1');
        expect(await recommend('feat: changed')).toBe('2.0.0-beta.1');
        expect(await recommend('feat: changed\n\nBREAKING CHANGE: changed')).toBe('2.0.0-beta.1');
      });
    });
  });

  describe('updateChangelog()', () => {
    const getFileContent = ({ logPath }: { logPath: string }) => readFile(logPath, 'utf8');

    it('creates files if they do not exist', async () => {
      const cwd = (await initFixture('changelog-missing')) as string;

      const [pkg1] = await Project.getPackages(cwd);
      const rootPkg = {
        name: 'root',
        location: cwd,
      };

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'feat: I should be placed in the CHANGELOG');

      // update version
      await pkg1.set('version', '1.1.0').serialize();

      const [leafChangelog, rootChangelog] = await Promise.all([
        updateChangelog(pkg1, 'fixed', { changelogPreset: 'angular' }),
        updateChangelog(rootPkg as Package, 'root', { version: '1.1.0' }),
      ]);

      expect(leafChangelog.logPath).toBe(join(pkg1.location, 'CHANGELOG.md'));
      expect(rootChangelog.logPath).toBe(join(rootPkg.location, 'CHANGELOG.md'));

      const [leafChangelogContent, rootChangelogContent] = await Promise.all([getFileContent(leafChangelog), getFileContent(rootChangelog)]);

      expect(leafChangelogContent).toMatchSnapshot('leaf');
      expect(rootChangelogContent).toMatchSnapshot('root');
    });

    it('creates changelog with changelogPreset when defined', async () => {
      const cwd = (await initFixture('changelog-missing')) as string;

      const [pkg1] = await Project.getPackages(cwd);
      const rootPkg = {
        name: 'root',
        location: cwd,
      };

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'feat: I should be placed in the CHANGELOG');

      // update version
      await pkg1.set('version', '1.1.0').serialize();

      const [leafChangelog, rootChangelog] = await Promise.all([
        updateChangelog(pkg1, 'fixed', {
          changelogPreset: {
            name: 'conventionalcommits',
            header: 'My Custom Header',
            types: [
              {
                type: 'feat',
                section: '✨ Features',
              },
              {
                type: 'fix',
                section: '🐛 Bug Fixes',
              },
              {
                type: 'chore',
                section: '🚀 Chore',
                hidden: true,
              },
              {
                type: 'docs',
                section: '📝 Documentation',
              },
            ],
            issuePrefixes: ['#'],
            issueUrlFormat: '{{host}}/{{owner}}/{{repository}}/issues/{{id}}',
            commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
            compareUrlFormat: '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',
            userUrlFormat: '{{host}}/{{user}}',
          },
        }),
        updateChangelog(rootPkg as Package, 'root', { version: '1.1.0' }),
      ]);

      expect(leafChangelog.logPath).toBe(join(pkg1.location, 'CHANGELOG.md'));
      expect(rootChangelog.logPath).toBe(join(rootPkg.location, 'CHANGELOG.md'));

      const [leafChangelogContent, rootChangelogContent] = await Promise.all([getFileContent(leafChangelog), getFileContent(rootChangelog)]);

      // the snapshot test is a little flaky, it could be either (`# 1.1.0 (YYYY-MM-DD)` or `## 1.1.0 (YYYY-MM-DD)`)
      // so let's normalize this version header line
      const normalizedLeafContent = leafChangelogContent.replace(/^# (1\.1\.0 $\d{4}-\d{2}-\d{2}$)/m, '## $1');
      const normalizedRootContent = rootChangelogContent.replace(/^# (1\.1\.0 $\d{4}-\d{2}-\d{2}$)/m, '## $1');

      expect(normalizedLeafContent).toMatchSnapshot('leaf');
      expect(normalizedRootContent).toMatchSnapshot('root');
    });

    it('updates fixed changelogs', async () => {
      const cwd = await initFixture('fixed');
      const rootPkg = {
        // no name
        location: cwd,
      };

      await gitTag(cwd, 'v1.0.0');

      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: A second commit for our CHANGELOG');

      // update version
      await pkg1.set('version', '1.0.1').serialize();

      const [leafChangelogContent, rootChangelogContent] = await Promise.all([
        updateChangelog(pkg1, 'fixed', /* default preset */ {}).then(getFileContent),
        updateChangelog(rootPkg as Package, 'root', { version: '1.0.1' }).then(getFileContent),
      ]);

      expect(leafChangelogContent).toMatchSnapshot('leaf');
      expect(rootChangelogContent).toMatchSnapshot('root');
    });

    it('supports custom tagPrefix in fixed mode', async () => {
      const cwd = await initFixture('fixed');

      await gitTag(cwd, 'dragons-are-awesome1.0.0');

      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: A second commit for our CHANGELOG');

      // update version
      await pkg1.set('version', '1.0.1').serialize();

      const [leafChangelog, rootChangelog] = await Promise.all([
        updateChangelog(pkg1, 'fixed', {
          tagPrefix: 'dragons-are-awesome',
        }),
        updateChangelog({ location: cwd } as Package, 'root', {
          tagPrefix: 'dragons-are-awesome',
          version: '1.0.1',
        }),
      ]);

      expect(leafChangelog.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/dragons-are-awesome1.0.0...dragons-are-awesome1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * A second commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))
      `);
      expect(rootChangelog.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/dragons-are-awesome1.0.0...dragons-are-awesome1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * A second commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))
      `);

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'chore(release): Publish v1.0.1');
      await gitTag(cwd, 'dragons-are-awesome1.0.1');

      // subsequent change
      await pkg1.set('changed', 2).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: A third commit for our CHANGELOG');

      const lastRootChangelog = await updateChangelog({ location: cwd } as Package, 'root', {
        tagPrefix: 'dragons-are-awesome',
        version: '1.0.2',
      });

      // second commit should not show up again
      expect(lastRootChangelog.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.2](/compare/dragons-are-awesome1.0.1...dragons-are-awesome1.0.2) (YYYY-MM-DD)


        ### Bug Fixes

        * A third commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))
      `);
    });

    it('supports custom tagPrefix in fixed mode when --changelog-include-commits-git-author is provided', async () => {
      const cwd = await initFixture('fixed');

      await gitTag(cwd, 'dragons-are-awesome1.0.0');

      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: A second commit for our CHANGELOG');

      // update version
      await pkg1.set('version', '1.0.1').serialize();

      const [leafChangelog, rootChangelog] = await Promise.all([
        updateChangelog(pkg1, 'fixed', {
          changelogIncludeCommitsGitAuthor: true,
          tagPrefix: 'dragons-are-awesome',
        }),
        updateChangelog({ location: cwd } as Package, 'root', {
          changelogIncludeCommitsGitAuthor: '', // empty string would be treated the same as being true but without a format
          tagPrefix: 'dragons-are-awesome',
          version: '1.0.1',
        }),
      ]);

      expect(leafChangelog.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/dragons-are-awesome1.0.0...dragons-are-awesome1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * A second commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD)) (Tester McPerson)
      `);
      expect(rootChangelog.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/dragons-are-awesome1.0.0...dragons-are-awesome1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * A second commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD)) (Tester McPerson)
      `);

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'chore(release): Publish v1.0.1');
      await gitTag(cwd, 'dragons-are-awesome1.0.1');

      // subsequent change
      await pkg1.set('changed', 2).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix: A third commit for our CHANGELOG');

      const lastRootChangelog = await updateChangelog({ location: cwd } as Package, 'root', {
        changelogIncludeCommitsGitAuthor: true,
        tagPrefix: 'dragons-are-awesome',
        version: '1.0.2',
      });

      // second commit should not show up again
      expect(lastRootChangelog.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.2](/compare/dragons-are-awesome1.0.1...dragons-are-awesome1.0.2) (YYYY-MM-DD)


        ### Bug Fixes

        * A third commit for our CHANGELOG ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD)) (Tester McPerson)
      `);
    });

    it('appends version bump message if no commits have been recorded', async () => {
      const cwd = await initFixture('fixed');

      await gitTag(cwd, 'v1.0.0');

      const [pkg1, pkg2] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix(pkg1): A dependency-triggered bump');

      // update version
      await pkg2.set('version', '1.0.1').serialize();

      const leafChangelog = await updateChangelog(pkg2, 'fixed', {
        changelogPreset: './scripts/local-preset',
      });

      expect(pkg2.isBumpOnlyVersion).toBeTruthy();
      expect(leafChangelog.newEntry.trimEnd()).toMatchInlineSnapshot(`
        <a name="1.0.1"></a>
        ## <small>1.0.1 (YYYY-MM-DD)</small>

        **Note:** Version bump only for package package-2
      `);
    });

    it('supports old preset API', async () => {
      const cwd = await initFixture('fixed');

      await gitTag(cwd, 'v1.0.0');

      const [pkg1] = await Project.getPackages(cwd);

      // make a change in package-1
      await pkg1.set('changed', 1).serialize();
      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix(pkg1): A commit using the old preset API');

      // update version
      await pkg1.set('version', '1.0.1').serialize();

      const leafChangelog = await updateChangelog(pkg1, 'fixed', {
        changelogPreset: './scripts/old-api-preset',
      });

      expect(leafChangelog.newEntry).toMatchInlineSnapshot(`
        <a name="1.0.1"></a>
        ## <small>1.0.1 (YYYY-MM-DD)</small>

        * fix(pkg1): A commit using the old preset API ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))

      `);
    });

    it('supports legacy callback presets', async () => {
      const cwd = await initFixture('fixed');

      await gitTag(cwd, 'v1.0.0');

      const [, pkg2] = await Project.getPackages(cwd);

      // make a change in package-2
      await pkg2.set('changed', 1).serialize();
      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'fix(pkg2): A commit using a legacy callback preset');

      // update version
      await pkg2.set('version', '1.0.1').serialize();

      const leafChangelog = await updateChangelog(pkg2, 'fixed', {
        changelogPreset: './scripts/legacy-callback-preset.js',
      });

      expect(leafChangelog.newEntry).toMatchInlineSnapshot(`
        <a name="1.0.1"></a>
        ## <small>1.0.1 (YYYY-MM-DD)</small>

        * fix(pkg2): A commit using a legacy callback preset ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))

      `);
    });

    it('supports config builder presets', async () => {
      const cwd = await initFixture('fixed');

      const configForPresetNameString = await GetChangelogConfig.getChangelogConfig('./scripts/config-builder-preset.js', cwd);
      expect(configForPresetNameString).toBeDefined();

      const presetConfigObject = { name: './scripts/config-builder-preset', key: 'value' };
      const configForPresetConfigObject = await GetChangelogConfig.getChangelogConfig(presetConfigObject, cwd);

      expect(configForPresetConfigObject).toBeDefined();
      expect(configForPresetConfigObject.key).toBe(presetConfigObject.key);

      await gitTag(cwd, 'v1.0.0');

      const [, pkg2] = await Project.getPackages(cwd);

      // make a change in package-2
      await pkg2.set('changed', 1).serialize();
      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'fix(pkg2): A commit using a legacy callback preset');

      // update version
      await pkg2.set('version', '1.0.1').serialize();

      const leafChangelog = await updateChangelog(pkg2, 'fixed', {
        changelogPreset: './scripts/config-builder-preset',
      });

      expect(leafChangelog.newEntry).toMatchInlineSnapshot(`
        <a name="1.0.1"></a>
        ## <small>1.0.1 (YYYY-MM-DD)</small>

        * fix(pkg2): A commit using a legacy callback preset ([SHA](https://github.com/lerna/conventional-commits-fixed/commit/GIT_HEAD))

      `);
    });

    it('updates independent changelogs', async () => {
      const cwd = await initFixture('independent');

      await gitTag(cwd, 'package-1@1.0.0');
      await gitTag(cwd, 'package-2@1.0.0');

      const [pkg1, pkg2] = await Project.getPackages(cwd);

      // make a change in package-1 and package-2
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix(stuff): changed');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'feat(thing): added');

      // update versions
      await pkg1.set('version', '1.0.1').serialize();
      await pkg2.set('version', '1.1.0').serialize();

      const opts = { changelogPreset: 'conventional-changelog-angular' };
      const [changelogOne, changelogTwo] = await Promise.all([updateChangelog(pkg1, 'independent', opts), updateChangelog(pkg2, 'independent', opts)]);

      expect(changelogOne.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/package-1@1.0.0...package-1@1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * **stuff:** changed ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD))
      `);
      expect(changelogTwo.newEntry.trimEnd()).toMatchInlineSnapshot(`
        # [1.1.0](/compare/package-2@1.0.0...package-2@1.1.0) (YYYY-MM-DD)


        ### Features

        * **thing:** added ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD))
      `);
    });

    it('updates independent changelogs and include commit author full name', async () => {
      const cwd = await initFixture('independent');

      await gitTag(cwd, 'package-1@1.0.0');
      await gitTag(cwd, 'package-2@1.0.0');

      const [pkg1, pkg2] = await Project.getPackages(cwd);

      // make a change in package-1 and package-2
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix(stuff): changed');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'feat(thing): added');

      // update versions
      await pkg1.set('version', '1.0.1').serialize();
      await pkg2.set('version', '1.1.0').serialize();

      const opts = {
        changelogPreset: 'conventional-changelog-angular',
        changelogHeaderMessage: '# Custom Header Message',
        changelogIncludeCommitsGitAuthor: true,
      };
      const [changelogOne, changelogTwo] = await Promise.all([updateChangelog(pkg1, 'independent', opts), updateChangelog(pkg2, 'independent', opts)]);

      expect(changelogOne.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/package-1@1.0.0...package-1@1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * **stuff:** changed ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD)) (Tester McPerson)
      `);
      expect(changelogOne.content.trimEnd()).toMatchInlineSnapshot(`
        # Change Log
        # Custom Header Message

        All notable changes to this project will be documented in this file.
        See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

        ## [1.0.1](/compare/package-1@1.0.0...package-1@1.0.1) (YYYY-MM-DD)

        ### Bug Fixes

        * **stuff:** changed ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD)) (Tester McPerson)
      `);
      expect(changelogTwo.newEntry.trimEnd()).toMatchInlineSnapshot(`
        # [1.1.0](/compare/package-2@1.0.0...package-2@1.1.0) (YYYY-MM-DD)


        ### Features

        * **thing:** added ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD)) (Tester McPerson)
      `);
    });

    it('updates independent changelogs when providing --changelog-include-commits-git-author with a custom format when defined', async () => {
      const cwd = await initFixture('independent');

      await gitTag(cwd, 'package-1@1.0.0');
      await gitTag(cwd, 'package-2@1.0.0');

      const [pkg1, pkg2] = await Project.getPackages(cwd);

      // make a change in package-1 and package-2
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      await gitCommit(cwd, 'fix(stuff): changed');

      await gitAdd(cwd, pkg2.manifestLocation);
      await gitCommit(cwd, 'feat(thing): added');

      // update versions
      await pkg1.set('version', '1.0.1').serialize();
      await pkg2.set('version', '1.1.0').serialize();

      const opts = {
        changelogPreset: 'conventional-changelog-angular',
        changelogIncludeCommitsGitAuthor: ' by **%a** (%e)',
      };
      const [changelogOne, changelogTwo] = await Promise.all([updateChangelog(pkg1, 'independent', opts), updateChangelog(pkg2, 'independent', opts)]);

      expect(changelogOne.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/package-1@1.0.0...package-1@1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * **stuff:** changed ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD)) by **Tester McPerson** (test@example.com)
      `);
      expect(changelogTwo.newEntry.trimEnd()).toMatchInlineSnapshot(`
        # [1.1.0](/compare/package-2@1.0.0...package-2@1.1.0) (YYYY-MM-DD)


        ### Features

        * **thing:** added ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD)) by **Tester McPerson** (test@example.com)
      `);
    });

    it('updates independent changelogs when providing --changelog-include-commits-client-login with a custom format when defined', async () => {
      const cwd = await initFixture('independent');

      await gitTag(cwd, 'package-1@1.0.0');
      await gitTag(cwd, 'package-2@1.0.0');

      const [pkg1, pkg2] = await Project.getPackages(cwd);

      // make a change in package-1 and package-2
      await pkg1.set('changed', 1).serialize();
      await pkg2.set('changed', 2).serialize();

      await gitAdd(cwd, pkg1.manifestLocation);
      const resultCommit1: any = await gitCommit(cwd, 'fix(stuff): changed');

      await gitAdd(cwd, pkg2.manifestLocation);
      const resultCommit2: any = await gitCommit(cwd, 'feat(thing): added');

      // update versions
      await pkg1.set('version', '1.0.1').serialize();
      await pkg2.set('version', '1.1.0').serialize();

      const opt1s = {
        changelogPreset: 'conventional-changelog-angular',
        changelogIncludeCommitsClientLogin: '', // empty string would be treated the same as being true but without a format
        commitsSinceLastRelease: [
          {
            authorName: 'Tester McPerson',
            login: 'tester-mcperson',
            hash: resultCommit1.stdout.match(/(\[main\s([0-9a-f]{7})\])/)[2],
            shortHash: resultCommit1.stdout.match(/(\[main\s([0-9a-f]{7})\])/)[2],
            message: 'fix(stuff): changed',
          },
        ],
      };
      const opt2s = {
        changelogPreset: 'conventional-changelog-angular',
        changelogIncludeCommitsClientLogin: ' from @%l, _%a (%e)_',
        commitsSinceLastRelease: [
          {
            authorName: 'Tester McPerson',
            login: 'tester-mcperson',
            hash: resultCommit2.stdout.match(/(\[main\s([0-9a-f]{7})\])/)[2],
            shortHash: resultCommit2.stdout.match(/(\[main\s([0-9a-f]{7})\])/)[2],
            message: 'feat(thing): added',
          },
        ],
      };
      const opt3s = {
        changelogPreset: 'conventional-changelog-angular',
        changelogIncludeCommitsClientLogin: ' from @%l, _%a (%e)_',
        commitsSinceLastRelease: [
          {
            authorName: 'Tester McPerson',
            login: 'tester-mcperson',
            hash: 'abc123', // invalid hash
            shortHash: 'abc123', // invalid hash
            message: 'feat(thing): added',
          },
        ],
      };

      const changelog1 = await updateChangelog(pkg1, 'independent', opt1s);
      const changelog2 = await updateChangelog(pkg2, 'independent', opt2s);
      const changelog3 = await updateChangelog(pkg2, 'independent', opt3s);

      expect(changelog1.newEntry.trimEnd()).toMatchInlineSnapshot(`
        ## [1.0.1](/compare/package-1@1.0.0...package-1@1.0.1) (YYYY-MM-DD)


        ### Bug Fixes

        * **stuff:** changed ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD)) (@tester-mcperson)
      `);
      expect(changelog2.newEntry.trimEnd()).toMatchInlineSnapshot(`
        # [1.1.0](/compare/package-2@1.0.0...package-2@1.1.0) (YYYY-MM-DD)


        ### Features

        * **thing:** added ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD)) from @tester-mcperson, _Tester McPerson (test@example.com)_
      `);

      // when SHA isn't found, it will still try to format the message but without a user @
      expect(changelog3.newEntry.trimEnd()).toMatchInlineSnapshot(`
        # [1.1.0](/compare/package-2@1.0.0...package-2@1.1.0) (YYYY-MM-DD)


        ### Features

        * **thing:** added ([SHA](https://github.com/lerna/conventional-commits-independent/commit/GIT_HEAD)) from @, _Tester McPerson (test@example.com)_
      `);
    });
  });

  describe('applyBuildMetadata', () => {
    it('alters version to include build metadata', () => {
      expect(applyBuildMetadata('1.0.0', '001')).toEqual('1.0.0+001');
    });

    it('does not alter version when build metadata is an empty string', () => {
      expect(applyBuildMetadata('1.0.0', '')).toEqual('1.0.0');
    });

    it('does not alter version when build metadata is null', () => {
      expect(applyBuildMetadata('1.0.0', null)).toEqual('1.0.0');
    });

    it('does not alter version when build metadata is undefined', () => {
      expect(applyBuildMetadata('1.0.0', undefined)).toEqual('1.0.0');
    });

    test.each([[' '], ['&'], ['a.'], ['a. '], ['a.%'], ['a..1']])('throws error given invalid build metadata %s', (buildMetadata) => {
      expect(() => applyBuildMetadata('1.0.0', buildMetadata)).toThrow(
        expect.objectContaining({
          name: 'ValidationError',
          message: 'Build metadata does not satisfy SemVer specification.',
        })
      );
    });
  });
});
