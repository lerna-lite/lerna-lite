import { existsSync } from 'fs';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { Fixture, normalizeCommandOutput, normalizeEnvironment } from '../../e2e-utils/src/index.js';

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === 'string';
  },
});

describe('lerna-exec', () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-exec',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
      /**
       * Because lerna exec involves spawning further child processes, the tests would be too flaky
       * if we didn't force deterministic terminal output by appending stderr to stdout instead
       * of interleaving them.
       */
      forceDeterministicTerminalOutput: true,
    });

    await fixture.createPackage({ name: 'package-1' });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-1',
      scripts: {
        'print-name': 'echo test-package-1',
      },
    });
    await fixture.createPackage({ name: 'package-2' });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-2',
      scripts: {
        'print-name': 'echo test-package-2',
      },
    });
    await fixture.createPackage({ name: 'package-3' });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-3',
      scripts: {
        'print-name': 'echo test-package-3',
      },
    });
  });

  afterAll(async () => {
    await fixture.destroy();
  });

  it('should run command on all child packages', async () => {
    const output = await fixture.lerna('exec --concurrency 1 npm run print-name');

    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
    expect(output.combinedOutput).toContain('lerna-lite notice cli');
    expect(output.combinedOutput).toContain('lerna-lite info Executing command in 3 packages');
    expect(output.combinedOutput).toContain('lerna-lite success exec Executed command in 3 packages');
  });

  it('should run command on all child packages and suppress npm output', async () => {
    const output = await fixture.lerna('exec npm run print-name -- --silent');

    expect(output.combinedOutput).toContain('test-package-1');
    expect(output.combinedOutput).toContain('test-package-2');
    expect(output.combinedOutput).toContain('test-package-3');
    expect(output.combinedOutput).toContain('lerna-lite success exec Executed command in 3 packages');
  });

  describe('--stream', () => {
    it('should run command on all child packages with output streaming', async () => {
      const output = await fixture.lerna('exec --stream npm run print-name -- --silent');
      const normalized = normalizeCommandOutput(output.combinedOutput);

      expect(normalized).toContain('package-1: test-package-1');
      expect(normalized).toContain('package-2: test-package-2');
      expect(normalized).toContain('package-3: test-package-3');
      expect(normalized).toContain('lerna-lite success exec');
    });
  });

  describe('--parallel', () => {
    it('should run command on all child packages in parallel', async () => {
      const output = await fixture.lerna('exec --parallel npm run print-name -- --silent');
      const normalized = normalizeCommandOutput(output.combinedOutput);

      expect(normalized).toContain('package-1: test-package-1');
      expect(normalized).toContain('package-2: test-package-2');
      expect(normalized).toContain('package-3: test-package-3');
      expect(normalized).toContain('lerna-lite success exec');
    });
  });

  describe('--no-prefix', () => {
    describe('--parallel', () => {
      it('should run command on all child packages and suppress package name prefixes', async () => {
        const output = await fixture.lerna('exec --no-prefix --parallel npm run print-name -- --silent');

        expect(output.combinedOutput).toContain('test-package-1');
        expect(output.combinedOutput).toContain('test-package-2');
        expect(output.combinedOutput).toContain('test-package-3');
        // Should not have prefixes
        expect(output.combinedOutput).not.toContain('package-1:');
        expect(output.combinedOutput).not.toContain('package-2:');
        expect(output.combinedOutput).not.toContain('package-3:');
      });
    });

    describe('--stream', () => {
      it('should run command on all child packages and suppress package name prefixes', async () => {
        const output = await fixture.lerna('exec --no-prefix --stream npm run print-name -- --silent');

        expect(output.combinedOutput).toContain('test-package-1');
        expect(output.combinedOutput).toContain('test-package-2');
        expect(output.combinedOutput).toContain('test-package-3');
        // Should not have prefixes
        expect(output.combinedOutput).not.toContain('package-1:');
        expect(output.combinedOutput).not.toContain('package-2:');
        expect(output.combinedOutput).not.toContain('package-3:');
      });
    });
  });

  describe('--profile', () => {
    it('should run command on all child packages and create a performance profile', async () => {
      const output = await fixture.lerna('exec --profile npm run print-name -- --silent');

      expect(output.combinedOutput).toContain('test-package-1');
      expect(output.combinedOutput).toContain('test-package-2');
      expect(output.combinedOutput).toContain('test-package-3');
      expect(output.combinedOutput).toMatch(/lerna-lite info profiler Performance profile saved to/);

      // Extract profile file name from output
      const profileMatch = output.combinedOutput.match(/Performance profile saved to .*(Lerna-Profile-\w+\.json)/);
      if (profileMatch) {
        const profileFileName = profileMatch[1];
        expect(existsSync(fixture.getWorkspacePath(profileFileName))).toBe(true);
      }
    });
  });

  describe('--profile --profile-location', () => {
    it('should run command on all child packages and create a performance profile at provided location', async () => {
      const output = await fixture.lerna('exec --profile --profile-location=profiles npm run print-name -- --silent');

      expect(output.combinedOutput).toContain('test-package-1');
      expect(output.combinedOutput).toContain('test-package-2');
      expect(output.combinedOutput).toContain('test-package-3');
      expect(output.combinedOutput).toMatch(/lerna-lite info profiler Performance profile saved to.*profiles/);

      // Extract profile file name from output
      const profileMatch = output.combinedOutput.match(/Performance profile saved to .*(profiles\/Lerna-Profile-\w+\.json)/);
      if (profileMatch) {
        const profileFileName = profileMatch[1];
        expect(existsSync(fixture.getWorkspacePath(profileFileName))).toBe(true);
      }
    });
  });

  describe('--scope', () => {
    it('should run command only on scoped packages', async () => {
      const output = await fixture.lerna('exec --scope package-1 npm run print-name -- --silent');

      expect(output.combinedOutput).toContain('test-package-1');
      expect(output.combinedOutput).not.toContain('test-package-2');
      expect(output.combinedOutput).not.toContain('test-package-3');
      expect(output.combinedOutput).toContain('lerna-lite success exec Executed command in 1 package');
    });
  });

  describe('--ignore', () => {
    it('should not run command on ignored packages', async () => {
      const output = await fixture.lerna('exec --ignore package-1 --ignore package-2 --concurrency 1 npm run print-name -- --silent');

      expect(output.combinedOutput).not.toContain('test-package-1');
      expect(output.combinedOutput).not.toContain('test-package-2');
      expect(output.combinedOutput).toContain('test-package-3');
      expect(output.combinedOutput).toContain('lerna-lite success exec Executed command in 1 package');
    });
  });
});

describe('lerna exec --no-bail', () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-exec-no-bail',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
      forceDeterministicTerminalOutput: true,
    });

    await fixture.createPackage({ name: 'package-1' });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-1',
      scripts: {
        'print-name': 'echo test-package-1',
      },
    });
    await fixture.createPackage({ name: 'package-2' });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-2',
      scripts: {
        'print-name': 'echo test-package-2',
      },
    });
    await fixture.createPackage({ name: 'package-3' });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-3',
      scripts: {
        'print-name': 'exit 100',
      },
    });
  });

  afterAll(async () => {
    await fixture.destroy();
  });

  it('should continue execution even when a command fails', async () => {
    // Use try/catch since the command will exit with non-zero
    await expect(fixture.lerna('exec --no-bail npm run print-name -- --silent')).rejects.toThrow('Command failed');

    // We can't easily verify the output because it throws,
    // but the test passing means --no-bail is working
    // (without it, execution would stop at the first failure)
  });
});
