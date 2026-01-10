import { existsSync } from 'node:fs';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { Fixture } from '../../e2e-utils/src/index.js';

describe('lerna-run', () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-run',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });

    // Create test packages with scripts
    await fixture.createPackage({
      name: 'package-1',
      version: '1.0.0',
    });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-1',
      scripts: {
        'print-name': 'echo test-package-1',
        'missing-script': 'missing-command',
      },
    });

    await fixture.createPackage({
      name: 'package-2',
      version: '1.0.0',
    });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-2',
      scripts: {
        'print-name': 'echo test-package-2',
      },
    });

    await fixture.createPackage({
      name: 'package-3',
      version: '1.0.0',
      dependencies: { 'package-1': '1.0.0', 'package-2': '1.0.0' },
    });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-3',
      scripts: {
        'print-name': 'echo test-package-3',
      },
    });

    await fixture.createInitialGitCommit();
  });

  afterAll(async () => {
    await fixture.destroy();
  });

  it('should run script on all child packages', async () => {
    const output = await fixture.lerna('run print-name');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
    expect(output.combinedOutput).toMatch(/Ran npm script 'print-name' in 3 packages/);
  });

  it('should run script with --stream flag', async () => {
    const output = await fixture.lerna('run print-name --stream');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
  });

  it('should run script with --parallel flag', async () => {
    const output = await fixture.lerna('run print-name --parallel');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
  });

  it('should run script with --scope flag', async () => {
    const output = await fixture.lerna('run print-name --scope package-1');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).not.toContain('test-package-2');
    expect(output.combinedOutput).not.toContain('test-package-3');
    expect(output.combinedOutput).toMatch(/Ran npm script 'print-name' in 1 package/);
  });

  it('should run script with --ignore flag', async () => {
    const output = await fixture.lerna('run print-name --ignore package-1');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).not.toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
    expect(output.combinedOutput).toMatch(/Ran npm script 'print-name' in 2 packages/);
  });

  it('should run script with --no-prefix and --parallel', async () => {
    const output = await fixture.lerna('run print-name --no-prefix --parallel');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
  });

  it('should run script with --no-prefix and --stream', async () => {
    const output = await fixture.lerna('run print-name --no-prefix --stream');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
  });

  it('should create performance profile with --profile', async () => {
    const output = await fixture.lerna('run print-name --profile');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('Performance profile saved to');

    // Extract profile filename from output
    const profileMatch = output.combinedOutput.match(/Performance profile saved to (.+)/);
    if (profileMatch) {
      const profilePath = profileMatch[1].trim();
      const relativePath = profilePath.split('lerna-workspace/')[1] || profilePath.split('lerna-workspace\\')[1];
      if (relativePath) {
        expect(existsSync(fixture.getWorkspacePath(relativePath))).toBe(true);
      }
    }
  });

  it('should create performance profile in custom location with --profile-location', async () => {
    const output = await fixture.lerna('run print-name --profile --profile-location=profiles');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('Performance profile saved to');
    expect(output.combinedOutput).toContain('profiles');

    // Extract profile filename from output
    const profileMatch = output.combinedOutput.match(/Performance profile saved to (.+)/);
    if (profileMatch) {
      const profilePath = profileMatch[1].trim();
      const relativePath = profilePath.split('lerna-workspace/')[1] || profilePath.split('lerna-workspace\\')[1];
      if (relativePath) {
        expect(relativePath).toContain('profiles');
        expect(existsSync(fixture.getWorkspacePath(relativePath))).toBe(true);
      }
    }
  });

  it('should run script with --include-dependencies', async () => {
    const output = await fixture.lerna('run print-name --scope package-3 --include-dependencies');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
    expect(output.combinedOutput).toMatch(/Ran npm script 'print-name' in 3 packages/);
  });

  it('should handle script errors with --no-bail', async () => {
    const result = await fixture.lerna('run missing-script --scope package-1 --no-bail', {
      silenceError: true,
    });

    expect(result.combinedOutput).toContain('lerna-lite');
    expect(result.combinedOutput).toMatch(/Received non-zero exit code|missing-command|command not found/i);
  });

  it('should log CI mode with --ci', async () => {
    const output = await fixture.lerna('run print-name --ci');

    expect(output.combinedOutput).toContain('lerna-lite');
    expect(output.combinedOutput).toContain('ci enabled');
  });
});
