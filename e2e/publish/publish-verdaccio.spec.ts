import { randomUUID } from 'node:crypto';

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
      const packageName = `lerna-lite-e2e-${randomUUID()}`;
      await fixture.createPackage({ name: packageName, version: '1.0.0' });
      await fixture.createInitialGitCommit();
      await fixture.exec('git tag v1.0.0');

      // Configure registry
      await fixture.exec('echo "registry=http://localhost:4873/" > .npmrc');

      // Verify Verdaccio is accessible
      const pingResult = await fixture.exec('npm ping --registry=http://localhost:4873/', { silenceError: true });
      if (pingResult.exitCode !== 0) {
        console.warn('Verdaccio ping failed, skipping test');
        return;
      }

      const output = await fixture.lerna('publish from-git --registry=http://localhost:4873/ -y');

      expect(output.combinedOutput).toContain(`${packageName}@1.0.0`);
      expect(output.combinedOutput).toContain('Successfully published');

      // A retry must recognize the exact version without masking other conflicts.
      const retry = await fixture.lerna('publish from-git --registry=http://localhost:4873/ -y');
      expect(retry.combinedOutput).toContain(`Package is already published: ${packageName}@1.0.0`);

      // Cleanup: unpublish the package
      await fixture.exec(`npm unpublish --force ${packageName}@1.0.0 --registry=http://localhost:4873/`, {
        silenceError: true,
      });
    });
  });

  describe('from-package', () => {
    it('should publish packages with updated versions', async () => {
      const packageName = `lerna-lite-e2e-${randomUUID()}`;
      await fixture.createPackage({ name: packageName, version: '1.0.0' });
      await fixture.createInitialGitCommit();

      const version = randomVersion();

      // Update package version manually
      await fixture.updatePackageVersion({
        packagePath: `packages/${packageName}`,
        newVersion: version,
      });
      await fixture.exec(`git add packages/${packageName}/package.json`);
      await fixture.exec('git commit -m "update package version"');

      // Configure registry
      await fixture.exec('echo "registry=http://localhost:4873/" > .npmrc');

      // Verify Verdaccio is accessible
      const pingResult = await fixture.exec('npm ping --registry=http://localhost:4873/', { silenceError: true });
      if (pingResult.exitCode !== 0) {
        console.warn('Verdaccio ping failed, skipping test');
        return;
      }

      const output = await fixture.lerna('publish from-package --registry=http://localhost:4873/ -y');

      expect(output.combinedOutput).toContain(`${packageName}@${version}`);
      expect(output.combinedOutput).toContain('Successfully published');

      // Cleanup
      await fixture.exec(`npm unpublish --force ${packageName}@${version} --registry=http://localhost:4873/`, {
        silenceError: true,
      });
    });
  });

  describe('--canary', () => {
    it('should publish canary versions', async () => {
      const packageName = `lerna-lite-e2e-${randomUUID()}`;
      await fixture.createPackage({ name: packageName, version: '1.0.0' });
      await fixture.createInitialGitCommit();

      // Configure registry
      await fixture.exec('echo "registry=http://localhost:4873/" > .npmrc');

      // Verify Verdaccio is accessible
      const pingResult = await fixture.exec('npm ping --registry=http://localhost:4873/', { silenceError: true });
      if (pingResult.exitCode !== 0) {
        console.warn('Verdaccio ping failed, skipping test');
        return;
      }

      const output = await fixture.lerna('publish --canary --registry=http://localhost:4873/ -y');

      expect(output.combinedOutput).toContain(packageName);
      expect(output.combinedOutput).toContain('Successfully published');

      // Cleanup - canary versions include commit SHA, so we won't try to unpublish
    });
  });
});
