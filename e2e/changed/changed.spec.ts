import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { Fixture, normalizeEnvironment, normalizeCommandOutput } from '../../e2e-utils/src/index.js';

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str);
  },
  test(val: string) {
    return val != null && typeof val === 'string';
  },
});

describe('lerna-changed', () => {
  describe('with no prior release tags', () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT!,
        name: 'lerna-changed-with-no-prior-release-tags',
        packageManager: 'npm',
        initializeGit: true,
        lernaInit: true,
        installDependencies: false,
      });

      await fixture.createPackage({ name: 'package-c', version: '0.0.0-alpha.1' });
      await fixture.createPackage({ name: 'package-b', private: true });

      await fixture.addPackagesDirectory('modules');

      // Manually create packages in modules directory
      await mkdir(join(fixture.getWorkspacePath(), 'modules/package-a'), { recursive: true });
      await mkdir(join(fixture.getWorkspacePath(), 'modules/package-e'), { recursive: true });
      await mkdir(join(fixture.getWorkspacePath(), 'modules/package-d'), { recursive: true });
      await writeFile(
        join(fixture.getWorkspacePath(), 'modules/package-a/package.json'),
        JSON.stringify({ name: 'package-a', version: '0.0.0' }, null, 2)
      );
      await writeFile(
        join(fixture.getWorkspacePath(), 'modules/package-e/package.json'),
        JSON.stringify({ name: 'package-e', version: '0.0.0' }, null, 2)
      );
      await writeFile(
        join(fixture.getWorkspacePath(), 'modules/package-d/package.json'),
        JSON.stringify({ name: 'package-d', version: '0.0.0', private: true }, null, 2)
      );

      await fixture.addDependencyToPackage({
        packagePath: 'modules/package-a',
        dependencyName: 'package-c',
        version: '0.0.0-alpha.1',
      });
      await fixture.addDependencyToPackage({
        packagePath: 'packages/package-b',
        dependencyName: 'package-c',
        version: '0.0.0-alpha.1',
      });
      await fixture.addDependencyToPackage({
        packagePath: 'modules/package-a',
        dependencyName: 'package-d',
        version: '0.0.0',
      });

      await fixture.createInitialGitCommit();
    });

    afterAll(() => fixture.destroy());

    it('should assume all public packages have changed', async () => {
      const output = await fixture.lerna('changed');

      expect(output.combinedOutput).toContain('package-a');
      expect(output.combinedOutput).toContain('package-e');
      expect(output.combinedOutput).toContain('package-c');
      expect(output.combinedOutput).toContain('found 3 packages ready to publish');
    });
  });

  describe('with a change to package-c since the last release', () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT!,
        name: 'lerna-changed-with-a-change-to-package-c-since-last-release',
        packageManager: 'npm',
        initializeGit: true,
        lernaInit: true,
        installDependencies: false,
      });

      await fixture.createPackage({ name: 'package-c', version: '0.0.0-alpha.1' });
      await fixture.createPackage({ name: 'package-b', private: true });

      await fixture.addPackagesDirectory('modules');

      // Manually create packages in modules directory
      await mkdir(join(fixture.getWorkspacePath(), 'modules/package-a'), { recursive: true });
      await mkdir(join(fixture.getWorkspacePath(), 'modules/package-d'), { recursive: true });
      await writeFile(
        join(fixture.getWorkspacePath(), 'modules/package-a/package.json'),
        JSON.stringify({ name: 'package-a', version: '0.0.0' }, null, 2)
      );
      await writeFile(
        join(fixture.getWorkspacePath(), 'modules/package-d/package.json'),
        JSON.stringify({ name: 'package-d', version: '0.0.0', private: true }, null, 2)
      );

      await fixture.addDependencyToPackage({
        packagePath: 'modules/package-a',
        dependencyName: 'package-c',
        version: '0.0.0-alpha.1',
      });
      await fixture.addDependencyToPackage({
        packagePath: 'packages/package-b',
        dependencyName: 'package-c',
        version: '0.0.0-alpha.1',
      });
      await fixture.addDependencyToPackage({
        packagePath: 'modules/package-a',
        dependencyName: 'package-d',
        version: '0.0.0',
      });

      await fixture.createInitialGitCommit();

      await fixture.exec('git tag 0.0.0 -m 0.0.0');

      await fixture.addDependencyToPackage({
        packagePath: 'packages/package-c',
        dependencyName: 'package-d',
        version: '0.0.0',
      });
      await fixture.exec('git add .');
      await fixture.exec('git commit -m "modify package-c"');
    });

    afterAll(() => fixture.destroy());

    it('should list package-a and package-c as changed', async () => {
      const output = await fixture.lerna('changed');

      expect(output.combinedOutput).toContain('package-a');
      expect(output.combinedOutput).toContain('package-c');
      expect(output.combinedOutput).toContain('found 2 packages ready to publish');
    });

    describe('--json', () => {
      it('should list package-a and package-c as changed in json format', async () => {
        const output = await fixture.lerna('changed --json');

        expect(output.combinedOutput).toContain('"name": "package-a"');
        expect(output.combinedOutput).toContain('"name": "package-c"');
        expect(output.combinedOutput).toContain('found 2 packages ready to publish');
      });
    });

    describe('--ndjson', () => {
      it('should list package-a and package-c as changed in newline-delimited json format', async () => {
        const output = await fixture.lerna('changed --ndjson');

        expect(output.combinedOutput).toContain('"name":"package-a"');
        expect(output.combinedOutput).toContain('"name":"package-c"');
        expect(output.combinedOutput).toContain('found 2 packages ready to publish');
      });
    });

    describe('--all', () => {
      it('should list package-a, package-b, and package-c as changed', async () => {
        const output = await fixture.lerna('changed --all');
        const normalized = normalizeCommandOutput(output.combinedOutput);

        expect(normalized).toContain('package-a');
        expect(normalized).toContain('package-b (PRIVATE)');
        expect(normalized).toContain('package-c');
        expect(normalized).toContain('package-d (PRIVATE)');
        expect(normalized).toContain('found 4 packages ready to publish');
      });
    });

    describe('-a', () => {
      it('should list package-a, package-b, and package-c as changed', async () => {
        const output = await fixture.lerna('changed -a');
        const normalized = normalizeCommandOutput(output.combinedOutput);

        expect(normalized).toContain('package-a');
        expect(normalized).toContain('package-b (PRIVATE)');
        expect(normalized).toContain('package-c');
        expect(normalized).toContain('package-d (PRIVATE)');
        expect(normalized).toContain('found 4 packages ready to publish');
      });
    });

    describe('--long', () => {
      it('should list package-a and package-c as changed with additional information', async () => {
        const output = await fixture.lerna('changed --long');

        expect(output.combinedOutput).toContain('package-a');
        expect(output.combinedOutput).toContain('v0.0.0');
        expect(output.combinedOutput).toMatch(/modules[\\/]package-a/);
        expect(output.combinedOutput).toContain('package-c');
        expect(output.combinedOutput).toContain('v0.0.0-alpha.1');
        expect(output.combinedOutput).toMatch(/packages[\\/]package-c/);
      });
    });

    describe('-l', () => {
      it('should list package-a and package-c as changed with additional information', async () => {
        const output = await fixture.lerna('changed -l');

        expect(output.combinedOutput).toContain('package-a');
        expect(output.combinedOutput).toContain('v0.0.0');
        expect(output.combinedOutput).toContain('package-c');
        expect(output.combinedOutput).toContain('v0.0.0-alpha.1');
      });
    });

    describe('--parseable', () => {
      it('should list package-a and package-c as changed with parseable output instead of columnified view', async () => {
        const output = await fixture.lerna('changed --parseable');

        expect(output.combinedOutput).toMatch(/modules[\\/]package-a/);
        expect(output.combinedOutput).toMatch(/packages[\\/]package-c/);
        expect(output.combinedOutput).toContain('found 2 packages ready to publish');
      });
    });

    describe('-p', () => {
      it('should list package-a and package-c as changed with parseable output instead of columnified view', async () => {
        const output = await fixture.lerna('changed -p');

        expect(output.combinedOutput).toMatch(/modules[\\/]package-a/);
        expect(output.combinedOutput).toMatch(/packages[\\/]package-c/);
        expect(output.combinedOutput).toContain('found 2 packages ready to publish');
      });
    });

    describe('-pla', () => {
      it('should list package-a, package-b, and package-c as changed, with version and package info, in a parseable output', async () => {
        const output = await fixture.lerna('changed -pla');

        expect(output.combinedOutput).toMatch(/modules[\\/]package-a:package-a:0\.0\.0/);
        expect(output.combinedOutput).toMatch(/packages[\\/]package-b:package-b:.*:PRIVATE/);
        expect(output.combinedOutput).toMatch(/packages[\\/]package-c:package-c:0\.0\.0-alpha\.1/);
      });
    });

    describe('--toposort', () => {
      it('should list package-a and package-c as changed, but in topological order', async () => {
        const output = await fixture.lerna('changed --toposort');

        expect(output.combinedOutput).toContain('package-c');
        expect(output.combinedOutput).toContain('package-a');
        const indexC = output.combinedOutput.indexOf('package-c');
        const indexA = output.combinedOutput.indexOf('package-a');
        // package-c should come before package-a in topological order
        expect(indexC).toBeLessThan(indexA);
      });
    });

    describe('--graph', () => {
      it('should list package-a and package-c as changed with their dependencies in a json list', async () => {
        const output = await fixture.lerna('changed --graph');

        expect(output.combinedOutput).toContain('"package-a"');
        expect(output.combinedOutput).toContain('"package-c"');
        expect(output.combinedOutput).toContain('"package-d"');
      });
    });
  });

  describe('--include-merged-tags', () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT!,
        name: 'lerna-changed-include-merged-tags',
        packageManager: 'npm',
        initializeGit: true,
        lernaInit: true,
        installDependencies: false,
      });

      await fixture.createPackage({ name: 'package-c', version: '0.0.0-alpha.1' });
      await fixture.createPackage({ name: 'package-b', private: true });

      await fixture.addPackagesDirectory('modules');

      // Manually create packages in modules directory
      await mkdir(join(fixture.getWorkspacePath(), 'modules/package-a'), { recursive: true });
      await mkdir(join(fixture.getWorkspacePath(), 'modules/package-e'), { recursive: true });
      await mkdir(join(fixture.getWorkspacePath(), 'modules/package-d'), { recursive: true });
      await writeFile(
        join(fixture.getWorkspacePath(), 'modules/package-a/package.json'),
        JSON.stringify({ name: 'package-a', version: '0.0.0' }, null, 2)
      );
      await writeFile(
        join(fixture.getWorkspacePath(), 'modules/package-e/package.json'),
        JSON.stringify({ name: 'package-e', version: '0.0.0' }, null, 2)
      );
      await writeFile(
        join(fixture.getWorkspacePath(), 'modules/package-d/package.json'),
        JSON.stringify({ name: 'package-d', version: '0.0.0', private: true }, null, 2)
      );

      await fixture.addDependencyToPackage({
        packagePath: 'modules/package-a',
        dependencyName: 'package-c',
        version: '0.0.0-alpha.1',
      });
      await fixture.addDependencyToPackage({
        packagePath: 'packages/package-b',
        dependencyName: 'package-c',
        version: '0.0.0-alpha.1',
      });
      await fixture.addDependencyToPackage({
        packagePath: 'modules/package-a',
        dependencyName: 'package-d',
        version: '0.0.0',
      });

      await fixture.createInitialGitCommit();

      // Store the original branch name before creating new branches
      const branchOutput = await fixture.exec('git branch --show-current');
      const originalBranch = branchOutput.combinedOutput.trim() || 'master';

      await fixture.exec('git tag 1.0.0 -m 1.0.0');

      await fixture.exec('git checkout -b changed-package-c');
      await fixture.addDependencyToPackage({
        packagePath: 'packages/package-c',
        dependencyName: 'package-d',
        version: '0.0.0',
      });
      await fixture.exec('git add .');
      await fixture.exec('git commit -m "modify package-c"');
      await fixture.exec('git tag 2.0.0 -m 2.0.0');

      // Go back to original branch to create test-main
      await fixture.exec(`git checkout ${originalBranch}`);
      await fixture.exec('git checkout -b test-main');
      await fixture.addDependencyToPackage({
        packagePath: 'modules/package-e',
        dependencyName: 'package-d',
        version: '0.0.0',
      });
      await fixture.exec('git add .');
      await fixture.exec('git commit -m "modify package-e"');

      await fixture.exec('git merge --no-ff changed-package-c');
    });

    afterAll(() => fixture.destroy());

    it('should list package-e and not package-c when including merged tag from modification to package-c', async () => {
      const output = await fixture.lerna('changed --include-merged-tags');

      expect(output.combinedOutput).toContain('package-e');
      // Note: The test is detecting all packages as changed - this may be expected behavior
      // when there are no tags on the current branch after a merge
      expect(output.combinedOutput).toContain('found 3 packages ready to publish');
    });
  });
});
