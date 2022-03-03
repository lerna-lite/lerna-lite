"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push", () => jest.requireActual('../lib/__mocks__/git-push'));
jest.mock("../lib/is-anything-committed", () => jest.requireActual('../lib/__mocks__/is-anything-committed'));
jest.mock("../lib/is-behind-upstream", () => jest.requireActual('../lib/__mocks__/is-behind-upstream'));
jest.mock("../lib/remote-branch-exists", () => jest.requireActual('../lib/__mocks__/remote-branch-exists'));

jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core') as any, // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../core/src/__mocks__/prompt').promptTextInput,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
}));

const path = require("path");
const yargParser = require('yargs-parser');

// mocked modules
const { promptSelectOne } = require("@lerna-lite/core");

// helpers
const initFixture = require("../../../../helpers/init-fixture")(path.resolve(__dirname, "../../../publish/src/__tests__"));
const { getCommitMessage } = require("../../../../helpers/get-commit-message");

// test command
import { VersionCommand } from '../versionCommand';

const createArgv = (cwd, ...args) => {
  args.unshift('version');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv;
};

describe("version bump", () => {
  it("accepts explicit versions", async () => {
    const testDir = await initFixture("normal");
    await new VersionCommand(createArgv(testDir, "--bump", "1.0.1-beta.25"));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.0.1-beta.25");
  });

  xit("receives --repo-version <value> as explicit [bump]", async () => {
    const testDir = await initFixture("normal");
    await new VersionCommand(createArgv(testDir, "--repo-version", "1.0.1-beta.25"));

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.0.1-beta.25");
  });

  xit("errors when --repo-version and [bump] positional passed", async () => {
    const testDir = await initFixture("normal");
    const command = await new VersionCommand(createArgv(testDir, "--bump", "v1.0.1-beta.25", "--repo-version", "v1.0.1-beta.25"));

    await expect(command).rejects.toThrow("Arguments repo-version and bump are mutually exclusive");
  });

  it("strips invalid semver information from explicit value", async () => {
    const testDir = await initFixture("normal");
    await new VersionCommand(createArgv(testDir, "--bump", "v1.2.0-beta.1+deadbeef"));

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.2.0-beta.1");
  });

  it("accepts semver keywords", async () => {
    const testDir = await initFixture("normal");
    await new VersionCommand(createArgv(testDir, "--bump", "minor"));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.1.0");
  });

  xit("receives --cd-version <bump>", async () => {
    const testDir = await initFixture("normal");
    await new VersionCommand(createArgv(testDir, "--cd-version", "premajor"));

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v2.0.0-alpha.0");
  });

  xit("errors when --cd-version and [bump] positional passed", async () => {
    const testDir = await initFixture("normal");
    const command = await new VersionCommand(createArgv(testDir, "--bump", "minor", "--cd-version", "minor"));

    await expect(command).rejects.toThrow("Arguments cd-version and bump are mutually exclusive");
  });

  xit("throws an error when an invalid semver keyword is used", async () => {
    const testDir = await initFixture("normal");
    const command = await new VersionCommand(createArgv(testDir, "--bump", "poopypants"));

    await expect(command).rejects.toThrow(
      "bump must be an explicit version string _or_ one of: " +
      "'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'."
    );
  });

  test("prerelease increments version with default --preid", async () => {
    const testDir = await initFixture("independent");

    await new VersionCommand(createArgv(testDir, "--bump", "prerelease"));

    const message = await getCommitMessage(testDir);
    expect(message).toContain("package-1@1.0.1-alpha.0");
    // TODO: (major) make --no-private the default
    expect(message).toContain("package-5@5.0.1-alpha.0");
  });

  test("prerelease increments version with custom --preid", async () => {
    const testDir = await initFixture("independent");

    await new VersionCommand(createArgv(testDir, "--bump", "prerelease", "--preid", "foo"));

    const message = await getCommitMessage(testDir);
    expect(message).toContain("package-1@1.0.1-foo.0");
  });

  it("ignores private packages with --no-private", async () => {
    const testDir = await initFixture("independent");

    await new VersionCommand(createArgv(testDir, "--bump", "patch", "--no-private"));

    const message = await getCommitMessage(testDir);
    // TODO: (major) make --no-private the default
    expect(message).not.toContain("package-5");
  });
});
