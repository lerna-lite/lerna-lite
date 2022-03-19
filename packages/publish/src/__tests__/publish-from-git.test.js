"use strict";

// FIXME: better mock for version command
jest.mock("../../../version/src/lib/git-push", () => jest.requireActual("../../../version/src/lib/__mocks__/git-push"));
jest.mock("../../../version/src/lib/is-anything-committed", () => jest.requireActual("../../../version/src/lib/__mocks__/is-anything-committed"));
jest.mock("../../../version/src/lib/is-behind-upstream", () => jest.requireActual("../../../version/src/lib/__mocks__/is-behind-upstream"));
jest.mock("../../../version/src/lib/remote-branch-exists", () => jest.requireActual("../../../version/src/lib/__mocks__/remote-branch-exists"));

// mocked modules of @lerna-lite/core
jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core'), // return the other real methods, below we'll mock only 2 of the methods
  collectUpdates: jest.requireActual('../../../core/src/__mocks__/collect-updates').collectUpdates,
  getOneTimePassword: () => Promise.resolve("654321"),
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual("../../../core/src/__mocks__/prompt").promptConfirmation,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
}));

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license", () => jest.requireActual('../lib/__mocks__/get-packages-without-license'));
jest.mock("../lib/verify-npm-package-access", () => jest.requireActual('../lib/__mocks__/verify-npm-package-access'));
jest.mock("../lib/get-npm-username", () => jest.requireActual('../lib/__mocks__/get-npm-username'));
jest.mock("../lib/get-two-factor-auth-required", () => jest.requireActual('../lib/__mocks__/get-two-factor-auth-required'));
jest.mock("../lib/get-unpublished-packages", () => jest.requireActual('../lib/__mocks__/get-unpublished-packages'));
jest.mock("../lib/npm-publish", () => jest.requireActual('../lib/__mocks__/npm-publish'));

// mocked modules
const { npmPublish } = require("../lib/npm-publish");
const { logOutput, promptConfirmation, throwIfUncommitted } = require("@lerna-lite/core");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { gitTag } = require("@lerna-test/git-tag");
const { loggingOutput } = require("@lerna-test/logging-output");

// test command
const yargParser = require('yargs-parser');
const { PublishCommand } = require("../publish-command");

const createArgv = (cwd, ...args) => {
  args.unshift('publish');
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv;
};

describe("publish from-git", () => {
  it("publishes tagged packages", async () => {
    const cwd = await initFixture("normal");

    await gitTag(cwd, "v1.0.0");
    await new PublishCommand(createArgv(cwd, '--bump', 'from-git'));

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    expect(promptConfirmation).toHaveBeenLastCalledWith("Are you sure you want to publish these packages?");
    expect(logOutput.logged()).toMatch("Found 4 packages to publish:");
    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-3",
      "package-4",
      "package-2",
      // package-5 is private
    ]);
  });

  it("publishes tagged independent packages", async () => {
    const cwd = await initFixture("independent");

    await Promise.all([
      gitTag(cwd, "package-1@1.0.0"),
      gitTag(cwd, "package-2@2.0.0"),
      gitTag(cwd, "package-3@3.0.0"),
      gitTag(cwd, "package-4@4.0.0"),
      gitTag(cwd, "package-5@5.0.0"),
    ]);
    await new PublishCommand(createArgv(cwd, '--bump', 'from-git'));

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-3",
      "package-4",
      "package-2",
      // package-5 is private
    ]);
  });

  it("publishes packages matching custom --tag-version-prefix", async () => {
    const cwd = await initFixture("normal");

    await gitTag(cwd, "foo/1.0.0");
    await new PublishCommand(createArgv(cwd, "--bump", "from-git", "--tag-version-prefix", "foo/"));

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-3",
      "package-4",
      "package-2",
      // package-5 is private
    ]);
  });

  it("only publishes independent packages with matching tags", async () => {
    const cwd = await initFixture("independent");

    await gitTag(cwd, "package-3@3.0.0");
    await new PublishCommand(createArgv(cwd, "--bump", "from-git"));

    expect(logOutput.logged()).toMatch("Found 1 package to publish:");
    expect(npmPublish.order()).toEqual(["package-3"]);
  });

  it("exits early when the current commit is not tagged", async () => {
    const cwd = await initFixture("normal");

    await new PublishCommand(createArgv(cwd, "--bump", "from-git"));

    expect(npmPublish).not.toHaveBeenCalled();

    const logMessages = loggingOutput("info");
    expect(logMessages).toContain("No tagged release found. You might not have fetched tags.");
  });

  it("throws an error when uncommitted changes are present", async () => {
    throwIfUncommitted.mockImplementationOnce(() => {
      throw new Error("uncommitted");
    });

    const cwd = await initFixture("normal");
    const command = new PublishCommand(createArgv(cwd, "--bump", "from-git"));

    await expect(command).rejects.toThrow("uncommitted");
    // notably different than the actual message, but good enough here
  });

  it("throws an error when --git-head is passed", async () => {
    const cwd = await initFixture("normal");
    const command = new PublishCommand(createArgv(cwd, "--bump", "from-git", "--git-head", "deadbeef"));

    await expect(command).rejects.toThrow(
      expect.objectContaining({
        prefix: "EGITHEAD",
      })
    );
  });
});
