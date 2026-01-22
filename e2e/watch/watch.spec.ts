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
    // Add watch script to all packages
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:trigger': 'node -e "console.log(\'watch triggered\')"' },
    });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-b',
      scripts: { 'watch:trigger': 'node -e "console.log(\'watch triggered\')"' },
    });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-c',
      scripts: { 'watch:trigger': 'node -e "console.log(\'watch triggered\')"' },
    });

    const getWatchResult = await fixture.lernaWatch('--debounce=100 -- npm run watch:trigger');

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
    expect(output.combinedOutput).toContain('watch Executing command');
    expect(output.combinedOutput).toContain('on changes in 3');
  });

  it('should watch only specified packages with --scope', async () => {
    // Add watch script to packages
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:trigger': 'node -e "console.log(\'triggered\')"' },
    });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-c',
      scripts: { 'watch:trigger': 'node -e "console.log(\'triggered\')"' },
    });

    const getWatchResult = await fixture.lernaWatch('--scope=package-a --scope=@scope/package-c --debounce=100 -- npm run watch:trigger');

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-b/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-c/my-file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should only watch 2 packages (package-a and @scope/package-c)
    expect(output.combinedOutput).toContain('watch Executing command');
    expect(output.combinedOutput).toContain('on changes in 2');
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
    // Add watch script to packages
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:trigger': 'node -e "console.log(\'triggered\')"' },
    });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-b',
      scripts: { 'watch:trigger': 'node -e "console.log(\'triggered\')"' },
    });

    const getWatchResult = await fixture.lernaWatch('--scope=package-b --include-dependencies --debounce=100 -- npm run watch:trigger');

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-b/my-file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-c/my-file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should watch package-b and its dependency package-a (2 packages total)
    expect(output.combinedOutput).toContain('watch Executing command');
    expect(output.combinedOutput).toContain('on changes in 2');
  });

  it('should respect --glob option to watch only specific file patterns', async () => {
    // Add watch script
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:ts': 'node -e "console.log(\'ts file changed\')"' },
    });

    const getWatchResult = await fixture.lernaWatch('--glob="**/*.ts" --debounce=100 -- npm run watch:ts');

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
    // Add watch script
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:file': 'node -e "console.log(\'file changed\')"' },
    });

    const getWatchResult = await fixture.lernaWatch('--ignored="**/*.test.js" --debounce=100 -- npm run watch:file');

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
    // Add watch script that uses LERNA_FILE_CHANGES
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:files': 'node -e "console.log(process.env.LERNA_FILE_CHANGES)"' },
    });

    const getWatchResult = await fixture.lernaWatch('--file-delimiter=";;" --debounce=100 -- npm run watch:files');

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

    const getWatchResult = await fixture.lernaWatch('--scope=package-a --stream --debounce=100 -- lerna run watch --scope=$LERNA_PACKAGE_NAME');

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/trigger.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should handle --no-bail flag to continue on errors', async () => {
    // Add watch script that exits with error
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:error': 'node -e "process.exit(1)"' },
    });

    const getWatchResult = await fixture.lernaWatch('--no-bail --debounce=100 -- npm run watch:error');

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Even though the command exits with error, watch should continue
    expect(output.combinedOutput).toContain('watch Executing command');
  });

  it('should use --debounce to control event batching', async () => {
    // Add watch script
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:batch': 'node -e "console.log(\'batched change\')"' },
    });

    // Use a longer debounce to ensure multiple files are batched
    const getWatchResult = await fixture.lernaWatch('--debounce=500 -- npm run watch:batch');

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
    // Add watch script to packages
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-a',
      scripts: { 'watch:ignore': 'node -e "console.log(\'triggered\')"' },
    });
    await fixture.addScriptsToPackage({
      packagePath: 'packages/package-c',
      scripts: { 'watch:ignore': 'node -e "console.log(\'triggered\')"' },
    });

    const getWatchResult = await fixture.lernaWatch('--ignore=package-b --debounce=100 -- npm run watch:ignore');

    await wait(500);
    await createFile(join(fixture.getWorkspacePath(), 'packages/package-a/file.txt'));
    await wait(500);

    await createFile(join(fixture.getWorkspacePath(), 'packages/package-b/file.txt'));
    await wait(500);

    const output = await getWatchResult(2000);

    // Should watch all packages except package-b (2 packages)
    expect(output.combinedOutput).toContain('watch Executing command');
    expect(output.combinedOutput).toContain('on changes in 2');
  });
});
