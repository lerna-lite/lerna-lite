"use strict";

// FIXME: better mock for version command
jest.mock("../../../version/src/lib/git-push", () => jest.requireActual("../../../version/src/lib/__mocks__/git-push"));
jest.mock("../../../version/src/lib/is-anything-committed", () => jest.requireActual("../../../version/src/lib/__mocks__/is-anything-committed"));
jest.mock("../../../version/src/lib/is-behind-upstream", () => jest.requireActual("../../../version/src/lib/__mocks__/is-behind-upstream"));
jest.mock("../../../version/src/lib/remote-branch-exists", () => jest.requireActual("../../../version/src/lib/__mocks__/remote-branch-exists"));

// mocked modules, mock only certain methods from core
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
jest.mock("../lib/pack-directory", () => jest.requireActual('../lib/__mocks__/pack-directory'));
jest.mock("../lib/npm-publish", () => jest.requireActual('../lib/__mocks__/npm-publish'));

const fs = require("fs-extra");
const path = require("path");

// mocked or stubbed modules
const writePkg = require("write-pkg");
const { npmPublish } = require("../lib/npm-publish");
const { logOutput, promptConfirmation, throwIfUncommitted } = require("@lerna-lite/core");
// const { throwIfUncommitted } = require("@lerna/check-working-tree");
const { getUnpublishedPackages } = require("../lib/get-unpublished-packages");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { loggingOutput } = require("@lerna-test/logging-output");

// file under test
const yargParser = require('yargs-parser');
const { PublishCommand } = require("../publish-command");

const createArgv = (cwd, ...args) => {
  args.unshift('publish');
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv;
};

describe("publish from-package", () => {
  it("publishes unpublished packages", async () => {
    const cwd = await initFixture("normal");

    getUnpublishedPackages.mockImplementationOnce((packageGraph) => {
      const pkgs = packageGraph.rawPackageList.slice(1, 3);
      return pkgs.map((pkg) => packageGraph.get(pkg.name));
    });

    await new PublishCommand(createArgv(cwd, "--bump", "from-package"));

    expect(promptConfirmation).toHaveBeenLastCalledWith("Are you sure you want to publish these packages?");
    expect(logOutput.logged()).toMatch("Found 2 packages to publish:");
    expect(npmPublish.order()).toEqual(["package-2", "package-3"]);
  });

  it("publishes unpublished independent packages", async () => {
    const cwd = await initFixture("independent");

    getUnpublishedPackages.mockImplementationOnce((packageGraph) => Array.from(packageGraph.values()));

    await new PublishCommand(createArgv(cwd, "--bump", "from-package"));

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-3",
      "package-4",
      "package-2",
      // package-5 is private
    ]);
  });

  it("exits early when all packages are published", async () => {
    const cwd = await initFixture("normal");

    await new PublishCommand(createArgv(cwd, "--bump", "from-package"));

    expect(npmPublish).not.toHaveBeenCalled();

    const logMessages = loggingOutput("notice");
    expect(logMessages).toContain("No unpublished release found");
  });

  it("throws an error when uncommitted changes are present", async () => {
    throwIfUncommitted.mockImplementationOnce(() => {
      throw new Error("uncommitted");
    });

    const cwd = await initFixture("normal");
    const command = new PublishCommand(createArgv(cwd, "--bump", "from-package"));

    await expect(command).rejects.toThrow("uncommitted");
    // notably different than the actual message, but good enough here
  });

  it("does not require a git repo", async () => {
    getUnpublishedPackages.mockImplementationOnce((packageGraph) => [packageGraph.get("package-1")]);

    const cwd = await initFixture("independent");

    // nuke the git repo first
    await fs.remove(path.join(cwd, ".git"));
    await new PublishCommand(createArgv(cwd, "--bump", "from-package"));

    expect(npmPublish).toHaveBeenCalled();
    expect(writePkg.updatedManifest("package-1")).not.toHaveProperty("gitHead");

    const logMessages = loggingOutput("notice");
    expect(logMessages).toContain("Unable to verify working tree, proceed at your own risk");
    expect(logMessages).toContain(
      "Unable to set temporary gitHead property, it will be missing from registry metadata"
    );
    expect(logMessages).toContain("Unable to reset working tree changes, this probably isn't a git repo.");
  });

  it("accepts --git-head override", async () => {
    getUnpublishedPackages.mockImplementationOnce((packageGraph) => [packageGraph.get("package-1")]);

    const cwd = await initFixture("independent");

    await new PublishCommand(createArgv(cwd, "--bump", "from-package", "--git-head", "deadbeef"));

    expect(npmPublish).toHaveBeenCalled();
    expect(writePkg.updatedManifest("package-1").gitHead).toBe("deadbeef");
  });
});
