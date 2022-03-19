// mocked modules of @lerna-lite/core
jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core') as any, // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../core/src/__mocks__/prompt').promptTextInput,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
}));

const path = require("path");
const fs = require("fs");
const yargParser = require('yargs-parser');

// mocked modules
const { logOutput } = require("@lerna-lite/core");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { gitAdd } = require("@lerna-test/git-add");
const { gitCheckout } = require("@lerna-test/git-checkout");
const { gitCommit } = require("@lerna-test/git-commit");
const { gitMerge } = require("@lerna-test/git-merge");
const { gitTag } = require("@lerna-test/git-tag");

// file under test
import { VersionCommand } from '../version-command';

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === "string";
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

// normalize temp directory paths in snapshots
expect.addSnapshotSerializer(require("@lerna-test/serialize-windows-paths"));
expect.addSnapshotSerializer(require("@lerna-test/serialize-tempdir"));

const createArgv = (cwd, ...args) => {
  args.unshift('version');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv;
};

describe("version --include-merged-tags", () => {
  const setupGitChangesWithBranch = async (cwd, mainPaths, branchPaths) => {
    await gitTag(cwd, "v1.0.0");
    await Promise.all(mainPaths.map((fp) => fs.appendFileSync(path.join(cwd, fp), "1")));
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "Commit");
    // Create release branch
    await gitCheckout(cwd, ["-b", "release/v1.0.1"]);
    // Switch into release branch
    await Promise.all(branchPaths.map((fp) => fs.appendFileSync(path.join(cwd, fp), "1")));
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "Bump");
    await gitTag(cwd, "v1.0.1");
    await gitCheckout(cwd, ["main"]);
    await gitMerge(cwd, ["--no-ff", "release/v1.0.1"]);
    // Commit after merge
    await Promise.all(mainPaths.map((fp) => fs.appendFileSync(path.join(cwd, fp), "1")));
    await gitAdd(cwd, "-A");
    await gitCommit(cwd, "Commit2");
  };

  describe("disabled", () => {
    it("should list changes to package-4", async () => {
      const testDir = await initFixture("basic");

      await setupGitChangesWithBranch(
        testDir,
        ["packages/package-2/random-file"],
        ["packages/package-4/random-file"]
      );
      // Without --include-merged-tags we receive all changes since the last tag on main
      // in this case it's v1.0.0, this includes changes to package-4 which was released
      // in the release branch with v1.0.1
      await new VersionCommand(createArgv(testDir, "--no-git-tag-version"));
      // await lernaVersion(testDir)("--no-git-tag-version");

      expect(logOutput.logged()).toMatchInlineSnapshot(`

Changes (3 packages):
 - package-2: 1.0.0 => 1.0.1
 - package-3: 1.0.0 => 1.0.1
 - package-4: 1.0.0 => 1.0.1

`);
    });
  });

  describe("enabled", () => {
    it("should not list changes to package-4", async () => {
      const testDir = await initFixture("basic");

      await setupGitChangesWithBranch(
        testDir,
        ["packages/package-2/random-file"],
        ["packages/package-4/random-file"]
      );
      // With --include-merged-tags we correctly detect that v1.0.1 was already tagged
      // and merged. We no longer want to receive package-4.
      await new VersionCommand(createArgv(testDir, "--no-git-tag-version", "--include-merged-tags"));
      // await lernaVersion(testDir)("--no-git-tag-version", "--include-merged-tags");

      expect(logOutput.logged()).toMatchInlineSnapshot(`

Changes (2 packages):
 - package-2: 1.0.0 => 1.0.1
 - package-3: 1.0.0 => 1.0.1

`);
    });
  });
});
