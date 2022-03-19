// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push", () => jest.requireActual('../lib/__mocks__/git-push'));
jest.mock("../lib/is-anything-committed", () => jest.requireActual('../lib/__mocks__/is-anything-committed'));
jest.mock("../lib/is-behind-upstream", () => jest.requireActual('../lib/__mocks__/is-behind-upstream'));
jest.mock("../lib/remote-branch-exists", () => jest.requireActual('../lib/__mocks__/remote-branch-exists'));
jest.mock("write-pkg", () => jest.requireActual("../lib/__mocks__/write-pkg"));

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
const yargParser = require('yargs-parser');

// mocked module(s)
const writePkg = require("write-pkg");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../../publish/src/__tests__"));

// test command
import { VersionCommand } from '../version-command';

const createArgv = (cwd, ...args) => {
  args.unshift('version');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv;
};

describe("git-hosted sibling specifiers", () => {
  test("gitCommittish", async () => {
    const cwd = await initFixture("git-hosted-sibling-committish");

    // await lernaVersion(cwd)("minor");
    await new VersionCommand(createArgv(cwd, "--bump", "minor"));

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "1.1.0",
      "package-2": "1.1.0",
      "package-3": "1.1.0",
      "package-4": "1.1.0",
      "package-5": "1.1.0",
    });

    // package-1 doesn't have any dependencies
    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "github:user/package-1#v1.1.0",
    });
    expect(writePkg.updatedManifest("package-3").devDependencies).toMatchObject({
      "package-2": "git+ssh://git@github.com/user/package-2.git#v1.1.0",
    });
    expect(writePkg.updatedManifest("package-4").dependencies).toMatchObject({
      "package-1": "github:user/package-1#v0.0.0", // non-matching semver
    });
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-1": "git+ssh://git@github.com/user/package-1.git#v1.1.0",
    });
  });

  test("gitRange", async () => {
    const cwd = await initFixture("git-hosted-sibling-semver");

    await new VersionCommand(createArgv(cwd, "--bump", "prerelease", "--preid", "beta"));

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "1.0.1-beta.0",
      "package-2": "1.0.1-beta.0",
      "package-3": "1.0.1-beta.0",
      "package-4": "1.0.1-beta.0",
      "package-5": "1.0.1-beta.0",
    });

    // package-1 doesn't have any dependencies
    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "github:user/package-1#semver:^1.0.1-beta.0",
    });
    // TODO: investigate why this test fails
    // expect(writePkg.updatedManifest("package-3").devDependencies).toMatchObject({
    //   "package-2": "git+ssh://git@github.com/user/package-2.git#semver:^1.0.1-beta.0",
    // });
    expect(writePkg.updatedManifest("package-4").dependencies).toMatchObject({
      "package-1": "github:user/package-1#semver:^0.1.0", // non-matching semver
    });
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-1": "git+ssh://git@github.com/user/package-1.git#semver:^1.0.1-beta.0",
    });
  });

  test("gitlab", async () => {
    const cwd = await initFixture("git-hosted-sibling-gitlab");

    await new VersionCommand(createArgv(cwd, "--bump", "premajor", "--preid", "rc"));

    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "2.0.0-rc.0",
      "package-2": "2.0.0-rc.0",
      "package-3": "2.0.0-rc.0",
      "package-4": "2.0.0-rc.0",
      "package-5": "2.0.0-rc.0",
    });

    // package-1 doesn't have any dependencies
    expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
      "package-1": "gitlab:user/package-1#v2.0.0-rc.0",
    });
    expect(writePkg.updatedManifest("package-3").devDependencies).toMatchObject({
      "package-2": "git+ssh://git@gitlab.com/user/package-2.git#v2.0.0-rc.0",
    });
    expect(writePkg.updatedManifest("package-4").dependencies).toMatchObject({
      "package-1": "git+https://user:token@gitlab.com/user/package-1.git#v2.0.0-rc.0",
    });
    expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
      "package-1": "git+ssh://git@gitlab.com/user/package-1.git#v2.0.0-rc.0",
    });
  });
});
