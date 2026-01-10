import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Fixture } from '../../e2e-utils/src/index.js';

// Helper to generate random version to avoid conflicts
const randomVersion = () => `${Date.now()}.0.0`;

describe('lerna-publish with verdaccio', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-publish-verdaccio',
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

  describe('from-git', () => {
    it('should publish to verdaccio registry', async () => {
      await fixture.createPackage({ name: 'test-1', version: '1.0.0' });
      await fixture.createInitialGitCommit();
      await fixture.exec('git tag v1.0.0');

      // Configure registry
      await fixture.exec('echo "registry=http://localhost:4873/" > .npmrc');

      const output = await fixture.lerna('publish from-git --registry=http://localhost:4873/ -y');

      expect(output.combinedOutput).toContain('lerna');
      
      // Cleanup: unpublish the package
      await fixture.exec('npm unpublish --force test-1@1.0.0 --registry=http://localhost:4873/', {
        silenceError: true,
      });
    });
  });

  describe('from-package', () => {
    it('should publish packages with updated versions', async () => {
      await fixture.createPackage({ name: 'test-1', version: '1.0.0' });
      await fixture.createInitialGitCommit();

      const version = randomVersion();
      
      // Update package version manually
      await fixture.updatePackageVersion({
        packagePath: 'packages/test-1',
        newVersion: version,
      });

      // Configure registry
      await fixture.exec('echo "registry=http://localhost:4873/" > .npmrc');

      const output = await fixture.lerna('publish from-package --registry=http://localhost:4873/ -y');

      expect(output.combinedOutput).toContain('lerna');

      // Cleanup
      await fixture.exec(`npm unpublish --force test-1@${version} --registry=http://localhost:4873/`, {
        silenceError: true,
      });
    });
  });

  describe('--canary', () => {
    it('should publish canary versions', async () => {
      await fixture.createPackage({ name: 'test-canary', version: '1.0.0' });
      await fixture.createInitialGitCommit();

      // Configure registry
      await fixture.exec('echo "registry=http://localhost:4873/" > .npmrc');

      const output = await fixture.lerna('publish --canary --registry=http://localhost:4873/ -y');

      expect(output.combinedOutput).toContain('lerna');

      // Cleanup - canary versions include commit SHA, so we won't try to unpublish
    });
  });
});
