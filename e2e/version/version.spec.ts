import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Fixture } from '../../e2e-utils/src/index.js';

describe('lerna-version', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-version',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });
    // lerna init already creates lerna.json with packages: ["packages/*"]
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  describe('patch', () => {
    it('should bump versions by patch', async () => {
      await fixture.createPackage({ name: 'package-a', version: '0.0.0' });
      await fixture.createPackage({ name: 'package-b', version: '0.0.0' });
      await fixture.createInitialGitCommit();

      // Make a change
      await fixture.exec('echo "test" > packages/package-a/test.txt');
      await fixture.exec('git add .');
      await fixture.exec('git commit -m "feat: add test file"');

      const output = await fixture.lerna('version patch -y --no-push');

      expect(output.combinedOutput).toContain('lerna-lite');

      // Check that version was bumped
      const packageJson = await fixture.readWorkspaceFile('packages/package-a/package.json');
      const version = JSON.parse(packageJson).version;
      expect(version).toMatch(/0\.0\.1/);
    });
  });

  describe('minor', () => {
    it('should bump versions by minor', async () => {
      await fixture.createPackage({ name: 'package-test', version: '0.0.0' });
      await fixture.createInitialGitCommit();

      await fixture.exec('echo "test" > packages/package-test/feature.txt');
      await fixture.exec('git add .');
      await fixture.exec('git commit -m "feat: new feature"');

      const output = await fixture.lerna('version minor -y --no-push');

      expect(output.combinedOutput).toContain('lerna');

      const packageJson = await fixture.readWorkspaceFile('packages/package-test/package.json');
      const version = JSON.parse(packageJson).version;
      expect(version).toMatch(/0\.1\.0/);
    });
  });

  describe('major', () => {
    it('should bump versions by major', async () => {
      await fixture.createPackage({ name: 'package-major', version: '0.0.0' });
      await fixture.createInitialGitCommit();

      await fixture.exec('echo "breaking" > packages/package-major/breaking.txt');
      await fixture.exec('git add .');
      await fixture.exec('git commit -m "feat!: breaking change"');

      const output = await fixture.lerna('version major -y --no-push');

      expect(output.combinedOutput).toContain('lerna');

      const packageJson = await fixture.readWorkspaceFile('packages/package-major/package.json');
      const version = JSON.parse(packageJson).version;
      expect(version).toMatch(/1\.0\.0/);
    });
  });

  describe('--conventional-commits', () => {
    it('should use conventional commits to determine version bump', async () => {
      await fixture.createPackage({ name: 'package-conv', version: '0.0.0' });
      await fixture.createInitialGitCommit();

      // Make a fix commit
      await fixture.exec('echo "fix" > packages/package-conv/fix.txt');
      await fixture.exec('git add .');
      await fixture.exec('git commit -m "fix: bug fix"');

      const output = await fixture.lerna('version --conventional-commits -y --no-push');

      expect(output.combinedOutput).toContain('lerna');

      // Should bump patch version
      const packageJson = await fixture.readWorkspaceFile('packages/package-conv/package.json');
      const version = JSON.parse(packageJson).version;
      expect(version).toMatch(/0\.0\.1/);
    });
  });

  describe('--no-git-tag-version', () => {
    it('should update versions but skip git tagging', async () => {
      await fixture.createPackage({ name: 'package-dry', version: '0.0.0' });
      await fixture.createInitialGitCommit();

      // Don't commit the changes - version with --no-git-tag-version will see uncommitted changes
      await fixture.exec('echo "change" > packages/package-dry/change.txt');
      await fixture.exec('git add .');

      const output = await fixture.lerna('version patch --no-git-tag-version -y');

      expect(output.combinedOutput).toContain('lerna');

      // Version should have changed (--no-git-tag-version updates package.json but skips git operations)
      const packageJson = await fixture.readWorkspaceFile('packages/package-dry/package.json');
      const version = JSON.parse(packageJson).version;
      expect(version).toBe('0.0.1');
    });
  });

  describe('with dependencies', () => {
    it('should update dependent package versions', async () => {
      await fixture.createPackage({ name: 'package-base', version: '0.0.0' });
      await fixture.createPackage({
        name: 'package-dep',
        version: '0.0.0',
        dependencies: { 'package-base': '0.0.0' },
      });
      await fixture.createInitialGitCommit();

      // Change the base package
      await fixture.exec('echo "update" > packages/package-base/update.txt');
      await fixture.exec('git add .');
      await fixture.exec('git commit -m "feat: update base"');

      const output = await fixture.lerna('version patch -y --no-push');

      expect(output.combinedOutput).toContain('lerna');

      // Check that dependent package was updated
      const depPackageJson = await fixture.readWorkspaceFile('packages/package-dep/package.json');
      const depPackage = JSON.parse(depPackageJson);
      expect(depPackage.dependencies['package-base']).toMatch(/0\.0\.1/);
    });
  });
});
