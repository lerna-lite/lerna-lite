"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push", () => jest.requireActual('../lib/__mocks__/git-push'));
jest.mock("../lib/is-anything-committed", () => jest.requireActual('../lib/__mocks__/is-anything-committed'));
jest.mock("../lib/is-behind-upstream", () => jest.requireActual('../lib/__mocks__/is-behind-upstream'));
jest.mock("../lib/remote-branch-exists", () => jest.requireActual('../lib/__mocks__/remote-branch-exists'));

// mocked modules of @lerna-lite/core
jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core') as any, // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../core/src/__mocks__/prompt').promptTextInput,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
}));

import path from 'path';
import execa from 'execa';
import yargParser from 'yargs-parser';

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../../publish/src/__tests__"));

// test command
import { VersionCommand } from '../index';

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('version');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: args });
  argv['$0'] = cwd;
  return argv;
};

describe("version --allow-branch", () => {
  const changeBranch = (cwd, name) => execa("git", ["checkout", "-B", name], { cwd });

  describe("cli", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "unmatched");
      const command = new VersionCommand(createArgv(testDir, '--allow-branch', 'main'));

      await expect(command).rejects.toThrow(`Branch "unmatched" is restricted from versioning`);
    });

    it("accepts an exactly matching branch", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "exact-match");
      const result = await new VersionCommand(createArgv(testDir, "--allow-branch", "exact-match"));

      expect((result as VersionCommand).updates).toHaveLength(5);
    });

    it("accepts a branch that matches by wildcard", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      const result = await new VersionCommand(createArgv(testDir, "--allow-branch", "feature/*"));

      expect((result as VersionCommand).updates).toHaveLength(5);
    });

    it("accepts a branch that matches one of the items passed", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      const result = await new VersionCommand(createArgv(testDir, "--allow-branch", "main", "feature/*"));

      expect((result as VersionCommand).updates).toHaveLength(5);
    });
  });

  describe("lerna.json", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "unmatched");
      const command = new VersionCommand(createArgv(testDir));

      await expect(command).rejects.toThrow(`Branch "unmatched" is restricted from versioning`);
    });

    it("accepts a matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "lerna");
      const result = await new VersionCommand(createArgv(testDir));

      expect((result as VersionCommand).updates).toHaveLength(1);
    });

    it("should prioritize cli over defaults", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "cli-override");
      const result = await new VersionCommand(createArgv(testDir, "--allow-branch", "cli-override"));

      expect((result as VersionCommand).updates).toHaveLength(1);
    });
  });
});
