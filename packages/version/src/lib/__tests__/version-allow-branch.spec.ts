"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../git-push", () => jest.requireActual('../__mocks__/git-push'));
jest.mock("../is-anything-committed", () => jest.requireActual('../__mocks__/is-anything-committed'));
jest.mock("../is-behind-upstream", () => jest.requireActual('../__mocks__/is-behind-upstream'));
jest.mock("../remote-branch-exists", () => jest.requireActual('../__mocks__/remote-branch-exists'));

import path from 'path';
import execa from 'execa';
import yargParser from 'yargs-parser';

// helpers
const initFixture = require("../../../../../helpers/init-fixture")(__dirname, "../../publish/__tests__");

// test command
import { commandRunner } from '../../../../../helpers/command-runner';
import { VersionCommand } from '../../index';

// stabilize commit SHA
expect.addSnapshotSerializer(require("../../../../../helpers/serialize-git-sha"));

const createArgv = (cwd: string, ...args: string[]) => {
  const p = args.join(' ');
  // const parserArgs = 'run ' + (args.join(' '));
  args.unshift('version');
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  // if (script) {
  //   argv.script = script;
  // }
  return argv;
};

describe("version --allow-branch", () => {
  const changeBranch = (cwd, name) => execa("git", ["checkout", "-B", name], { cwd });

  describe("cli", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "unmatched");
      const command = new VersionCommand(createArgv(testDir, '--allow-branch', 'main'));
      // const command = commandRunner(testDir, 'version')('--allow-branch', 'main');
      // const command = lernaVersion(testDir)("--allow-branch", "main");

      await expect(command).rejects.toThrow("Branch 'unmatched' is restricted from versioning");
    });

    xit("accepts an exactly matching branch", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "exact-match");
      const result = new VersionCommand(createArgv(testDir, "--allow-branch", "exact-match"));
      // const result = await lernaVersion(testDir)("--allow-branch", "exact-match");

      expect(result.updates).toHaveLength(5);
    });

    xit("accepts a branch that matches by wildcard", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      const command = new VersionCommand(createArgv(testDir, "--allow-branch", "feature/*"));
      // const result = await lernaVersion(testDir)("--allow-branch", "feature/*");

      expect(result.updates).toHaveLength(5);
    });

    xit("accepts a branch that matches one of the items passed", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      const result = await lernaVersion(testDir)("--allow-branch", "main", "feature/*");

      expect(result.updates).toHaveLength(5);
    });
  });

  describe("lerna.json", () => {
    xit("rejects a non matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "unmatched");
      const command = lernaVersion(testDir)();

      await expect(command).rejects.toThrow("Branch 'unmatched' is restricted from versioning");
    });

    xit("accepts a matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "lerna");
      const result = await lernaVersion(testDir)();

      expect(result.updates).toHaveLength(1);
    });

    xit("should prioritize cli over defaults", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "cli-override");
      const result = await lernaVersion(testDir)("--allow-branch", "cli-override");

      expect(result.updates).toHaveLength(1);
    });
  });
});
