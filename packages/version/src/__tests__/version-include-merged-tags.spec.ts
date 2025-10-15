import { appendFileSync } from 'node:fs';
import { join, dirname as pathDirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// mocked modules
import { logOutput, type VersionCommandOption } from '@lerna-lite/core';
import { gitAdd, gitCheckout, gitCommit, gitMerge, gitTag, initFixtureFactory } from '@lerna-test/helpers';
// normalize temp directory paths in snapshots
import serializeTempdir from '@lerna-test/helpers/serializers/serialize-tempdir.js';
import serializeWindowsPaths from '@lerna-test/helpers/serializers/serialize-windows-paths.js';
import { describe, expect, it, vi } from 'vitest';
import yargParser from 'yargs-parser';
// file under test
import { VersionCommand } from '../version-command.js';

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

const initFixture = initFixtureFactory(__dirname);

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

expect.addSnapshotSerializer(serializeWindowsPaths);
expect.addSnapshotSerializer(serializeTempdir);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as VersionCommandOption;
};

describe('version --include-merged-tags', () => {
  const setupGitChangesWithBranch = async (cwd: string, mainPaths: string[], branchPaths: string[]) => {
    await gitTag(cwd, 'v1.0.0');
    await Promise.all(mainPaths.map((fp) => appendFileSync(join(cwd, fp), '1')));
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'Commit');
    // Create release branch
    await gitCheckout(cwd, ['-b', 'release/v1.0.1']);
    // Switch into release branch
    await Promise.all(branchPaths.map((fp) => appendFileSync(join(cwd, fp), '1')));
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'Bump');
    await gitTag(cwd, 'v1.0.1');
    await gitCheckout(cwd, ['main']);
    await gitMerge(cwd, ['--no-ff', 'release/v1.0.1']);
    // Commit after merge
    await Promise.all(mainPaths.map((fp) => appendFileSync(join(cwd, fp), '1')));
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'Commit2');
  };

  describe('disabled', () => {
    it('should list changes to package-4', async () => {
      const testDir = await initFixture('basic');

      await setupGitChangesWithBranch(testDir, ['packages/package-2/random-file'], ['packages/package-4/random-file']);
      // Without --include-merged-tags we receive all changes since the last tag on main
      // in this case it's v1.0.0, this includes changes to package-4 which was released
      // in the release branch with v1.0.1
      await new VersionCommand(createArgv(testDir, '--no-git-tag-version'));
      // await lernaVersion(testDir)("--no-git-tag-version");

      expect((logOutput as any).logged()).toMatchInlineSnapshot(`

Changes (3 packages):
 - package-2: 1.0.0 => 1.0.1
 - package-3: 1.0.0 => 1.0.1
 - package-4: 1.0.0 => 1.0.1

`);
    });
  });

  describe('enabled', () => {
    it('should not list changes to package-4', async () => {
      const testDir = await initFixture('basic');

      await setupGitChangesWithBranch(testDir, ['packages/package-2/random-file'], ['packages/package-4/random-file']);
      // With --include-merged-tags we correctly detect that v1.0.1 was already tagged
      // and merged. We no longer want to receive package-4.
      await new VersionCommand(createArgv(testDir, '--no-git-tag-version', '--include-merged-tags'));
      // await lernaVersion(testDir)("--no-git-tag-version", "--include-merged-tags");

      expect((logOutput as any).logged()).toMatchInlineSnapshot(`

Changes (2 packages):
 - package-2: 1.0.0 => 1.0.1
 - package-3: 1.0.0 => 1.0.1

`);
    });
  });
});
