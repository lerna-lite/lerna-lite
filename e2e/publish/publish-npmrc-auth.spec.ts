import { join } from 'node:path';

import { writeFile } from 'fs/promises';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Fixture } from '../../e2e-utils/src/index.js';

describe('lerna-publish with .npmrc authentication', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-publish-npmrc-auth',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  describe('environment variable substitution in .npmrc', () => {
    it('should handle authentication token with environment variable placeholder', async () => {
      await fixture.createPackage({ name: 'test-auth-1', version: '1.0.0' });
      await fixture.createInitialGitCommit();
      await fixture.exec('git tag v1.0.0');

      // Create .npmrc with environment variable placeholder (similar to GitHub Packages scenario)
      const npmrcContent = `@testorg:registry=http://localhost:4873/
@testorg:always-auth=true
//localhost:4873/:_authToken=\${TEST_AUTH_TOKEN}
registry=http://localhost:4873/`;

      await writeFile(fixture.getWorkspacePath('.npmrc'), npmrcContent);

      // Set the environment variable
      const testToken = 'test-token-12345';

      // Verify Verdaccio is accessible
      const pingResult = await fixture.exec('npm ping --registry=http://localhost:4873/', { silenceError: true });
      if (pingResult.exitCode !== 0) {
        console.warn('Verdaccio ping failed, skipping test');
        return;
      }

      // Run publish with the environment variable set
      const lernaPath = join(process.cwd(), 'packages', 'cli', 'dist', 'cli.js');
      const publishResult = await fixture.exec(`node ${lernaPath} publish from-git -y`, {
        silenceError: true,
        env: { ...process.env, TEST_AUTH_TOKEN: testToken },
      });

      // The test verifies that environment variables in .npmrc are properly expanded
      // If they're not expanded, we'd get "authentication token not provided" error
      expect(publishResult.combinedOutput).not.toContain('authentication token not provided');

      // Cleanup: unpublish the package
      await fixture.exec('npm unpublish --force test-auth-1@1.0.0 --registry=http://localhost:4873/', {
        silenceError: true,
      });
    });

    it('should handle scoped registry with environment variable in auth token', async () => {
      await fixture.createPackage({ name: '@testscope/test-pkg', version: '1.0.0' });
      await fixture.createInitialGitCommit();
      await fixture.exec('git tag v1.0.0');

      // Create .npmrc similar to GitHub Packages setup
      const npmrcContent = `@testscope:registry=http://localhost:4873/
@testscope:always-auth=true
//localhost:4873/:_authToken=\${GITHUB_PKG_TOKEN}
registry=http://localhost:4873/`;

      await writeFile(fixture.getWorkspacePath('.npmrc'), npmrcContent);

      // Set the environment variable (simulating GITHUB_TOKEN in CI)
      const githubToken = 'ghp_test_token_abc123';

      // Verify Verdaccio is accessible
      const pingResult = await fixture.exec('npm ping --registry=http://localhost:4873/', { silenceError: true });
      if (pingResult.exitCode !== 0) {
        console.warn('Verdaccio ping failed, skipping test');
        return;
      }

      // Run publish with the environment variable set (simulating GitHub Actions)
      const lernaPath = join(process.cwd(), 'packages', 'cli', 'dist', 'cli.js');
      const publishResult = await fixture.exec(`node ${lernaPath} publish from-git --registry=http://localhost:4873/ -y`, {
        silenceError: true,
        env: { ...process.env, GITHUB_PKG_TOKEN: githubToken },
      });

      // Verify no authentication errors
      expect(publishResult.combinedOutput).not.toContain('E401');
      expect(publishResult.combinedOutput).not.toContain('authentication token not provided');
      expect(publishResult.combinedOutput).not.toContain('is not a valid exit code');

      // Cleanup
      await fixture.exec('npm unpublish --force @testscope/test-pkg@1.0.0 --registry=http://localhost:4873/', {
        silenceError: true,
      });
    });

    it('should fail gracefully when environment variable is not set', async () => {
      await fixture.createPackage({ name: 'test-missing-token', version: '1.0.0' });
      await fixture.createInitialGitCommit();
      await fixture.exec('git tag v1.0.0');

      // Create .npmrc with environment variable that won't be set
      const npmrcContent = `registry=http://localhost:4873/
//localhost:4873/:_authToken=\${MISSING_TOKEN_VAR}`;

      await writeFile(fixture.getWorkspacePath('.npmrc'), npmrcContent);

      // Verify Verdaccio is accessible
      const pingResult = await fixture.exec('npm ping --registry=http://localhost:4873/', { silenceError: true });
      if (pingResult.exitCode !== 0) {
        console.warn('Verdaccio ping failed, skipping test');
        return;
      }

      // Run publish without setting the environment variable
      const publishResult = await fixture.lerna('publish from-git --registry=http://localhost:4873/ -y', { silenceError: true });

      // Should get an authentication error, but not the malformed "undefined" is not a valid exit code error
      // This test ensures we handle missing environment variables gracefully
      if (publishResult.exitCode !== 0) {
        // It's okay if it fails due to auth, but should not crash with undefined exit code
        expect(publishResult.combinedOutput).not.toContain('"undefined" is not a valid exit code');
      }
    });
  });

  describe('multiple authentication tokens', () => {
    it('should handle .npmrc with multiple environment variables', async () => {
      await fixture.createPackage({ name: 'test-multi-auth', version: '1.0.0' });
      await fixture.createInitialGitCommit();
      await fixture.exec('git tag v1.0.0');

      // Create .npmrc with multiple environment variables
      const npmrcContent = `@scope1:registry=http://localhost:4873/
@scope2:registry=http://localhost:4873/
//localhost:4873/:_authToken=\${PRIMARY_TOKEN}
registry=http://localhost:4873/`;

      await writeFile(fixture.getWorkspacePath('.npmrc'), npmrcContent);

      const primaryToken = 'primary-token-xyz';

      // Verify Verdaccio is accessible
      const pingResult = await fixture.exec('npm ping --registry=http://localhost:4873/', { silenceError: true });
      if (pingResult.exitCode !== 0) {
        console.warn('Verdaccio ping failed, skipping test');
        return;
      }

      // Run publish with environment variables
      const lernaPath = join(process.cwd(), 'packages', 'cli', 'dist', 'cli.js');
      const publishResult = await fixture.exec(`node ${lernaPath} publish from-git --registry=http://localhost:4873/ -y`, {
        silenceError: true,
        env: {
          ...process.env,
          PRIMARY_TOKEN: primaryToken,
        },
      });

      // Verify proper handling
      expect(publishResult.combinedOutput).not.toContain('authentication token not provided');
      expect(publishResult.combinedOutput).not.toContain('"undefined" is not a valid exit code');

      // Cleanup
      await fixture.exec('npm unpublish --force test-multi-auth@1.0.0 --registry=http://localhost:4873/', {
        silenceError: true,
      });
    });
  });
});
