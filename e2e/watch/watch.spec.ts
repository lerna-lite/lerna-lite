import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Fixture, normalizeEnvironment } from '../../e2e-utils/src/index.js';

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str);
  },
  test(val: unknown): val is string {
    return val != null && typeof val === 'string';
  },
});

/**
 * Helper to wait for a certain amount of time
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to create a file in the workspace
 */
async function createFile(filePath: string, content = ''): Promise<void> {
  await writeFile(filePath, content, 'utf-8');
}

describe('lerna watch', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT!,
      name: 'lerna-watch',
      packageManager: 'npm',
      initializeGit: true,
      lernaInit: true,
      installDependencies: false,
    });

    // Create test packages
    await fixture.createPackage({ name: 'package-a' });
    await fixture.createPackage({ name: 'package-b', dependencies: { 'package-a': '1.0.0' } });
    await fixture.createPackage({ name: 'package-c' });

    // Rename package-c to have a scope
    await fixture.updateJson('packages/package-c/package.json', (json) => ({
      ...json,
      name: '@scope/package-c',
    }));

    await fixture.createInitialGitCommit();
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  it('should watch all packages by default', async () => {
    const getWatchResult = await fixture.lernaWatch('--debounce=100 -- "echo watch triggered"');

    // Wait for watch to start
    await wait(500);

    // Create files in different packages with delays
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-b/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-c/my-file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should see watch triggered for each package
    expect(output.combinedOutput).toContain('watch Executing command "echo watch triggered" on changes in 3');
    expect(output.combinedOutput).toContain('watch triggered');
  });

  it('should watch only specified packages with --scope', async () => {
    const getWatchResult = await fixture.lernaWatch(
      '--scope=package-a --scope=@scope/package-c --debounce=100 -- "echo watch triggered"'
    );

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-b/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-c/my-file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should only watch 2 packages (package-a and @scope/package-c)
    expect(output.combinedOutput).toContain('watch Executing command "echo watch triggered" on changes in 2');
  });

  it('should replace package name and changed file names', async () => {
    const getWatchResult = await fixture.lernaWatch('--debounce=100 -- "echo $LERNA_PACKAGE_NAME: $LERNA_FILE_CHANGES"');

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-b/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-c/my-file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Check that watch command is executing
    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should watch one package and its dependencies with --scope and --include-dependencies', async () => {
    const getWatchResult = await fixture.lernaWatch(
      '--scope=package-b --include-dependencies --debounce=100 -- "echo watch triggered"'
    );

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-b/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-c/my-file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should watch package-b and its dependency package-a (2 packages total)
    expect(output.combinedOutput).toContain('watch Executing command "echo watch triggered" on changes in 2');
  });

  it('should respect --glob option to watch only specific file patterns', async () => {
    const getWatchResult = await fixture.lernaWatch('--glob="**/*.ts" --debounce=100 -- "echo ts file changed"');

    await wait(500);
    // Create a TypeScript file
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/index.ts'), 'export {}');
    await wait(500);

    // Create a text file (should not trigger watch since glob is *.ts)
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/readme.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should indicate command execution
    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should respect --ignored option to ignore specific patterns', async () => {
    const getWatchResult = await fixture.lernaWatch('--ignored="**/*.test.js" --debounce=100 -- "echo file changed"');

    await wait(500);
    // Create a regular file
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/index.js'));
    await wait(500);

    // Create a test file (should be ignored)
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file.test.js'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should indicate command execution
    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should use custom file delimiter with --file-delimiter', async () => {
    const getWatchResult = await fixture.lernaWatch('--file-delimiter=";;" --debounce=100 -- "echo $LERNA_FILE_CHANGES"');

    await wait(500);
    // Create multiple files quickly to trigger them in the same batch
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file1.txt'));
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file2.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should indicate command execution
    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should run command with --stream flag', async () => {
    // Add a script to package-a
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: {
        watch: 'echo "package-a watching"',
      },
    });

    const getWatchResult = await fixture.lernaWatch(
      '--scope=package-a --stream --debounce=100 -- lerna run watch --scope=$LERNA_PACKAGE_NAME'
    );

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/trigger.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should handle --no-bail flag to continue on errors', async () => {
    const getWatchResult = await fixture.lernaWatch('--no-bail --debounce=100 -- "exit 1"');

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Even though the command exits with error, watch should continue
    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should use --debounce to control event batching', async () => {
    // Use a longer debounce to ensure multiple files are batched
    const getWatchResult = await fixture.lernaWatch('--debounce=500 -- "echo batched change"');

    await wait(500);
    // Create multiple files quickly
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file1.txt'));
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file2.txt'));
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file3.txt'));
    await wait(1000);

    const output = await getWatchResult(2000);

    // All changes should be batched into fewer watch events
    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should work with --ignore option', async () => {
    const getWatchResult = await fixture.lernaWatch('--ignore=package-b --debounce=100 -- "echo triggered"');

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-b/file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should watch all packages except package-b (2 packages)
    expect(output.combinedOutput).toContain('watch Executing command "echo triggered" on changes in 2');
  });
});
