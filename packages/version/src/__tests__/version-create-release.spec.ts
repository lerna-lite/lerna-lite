// local modules _must_ be explicitly mocked
jest.mock("../lib/git-add", () => jest.requireActual('../lib/__mocks__/git-add'));
jest.mock("../lib/git-commit", () => jest.requireActual('../lib/__mocks__/git-commit'));
jest.mock("../lib/git-push", () => jest.requireActual('../lib/__mocks__/git-push'));
jest.mock("../lib/git-tag", () => jest.requireActual('../lib/__mocks__/git-tag'));
jest.mock("../lib/is-anything-committed", () => jest.requireActual('../lib/__mocks__/is-anything-committed'));
jest.mock("../lib/is-behind-upstream", () => jest.requireActual('../lib/__mocks__/is-behind-upstream'));
jest.mock("../lib/remote-branch-exists", () => jest.requireActual('../lib/__mocks__/remote-branch-exists'));

jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core') as any, // return the other real methods, below we'll mock only 2 of the methods
  createGitHubClient: jest.requireActual('../../../core/src/__mocks__/github-client').createGitHubClient,
  createGitLabClient: jest.requireActual('../../../core/src/__mocks__/gitlab-client').createGitLabClient,
  parseGitRepo: jest.requireActual('../../../core/src/__mocks__/github-client').parseGitRepo,
  recommendVersion: jest.requireActual('../../../core/src/__mocks__/conventional-commits').recommendVersion,
  updateChangelog: jest.requireActual('../../../core/src/__mocks__/conventional-commits').updateChangelog,
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../core/src/__mocks__/prompt').promptTextInput,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
}));

// also point to the local version command so that all mocks are properly used even by the command-runner
jest.mock('@lerna-lite/version', () => jest.requireActual('../version-command'));

// mocked modules
const { createGitHubClient } = require("@lerna-lite/core");
const { createGitLabClient } = require("@lerna-lite/core");
const { recommendVersion } = require("@lerna-lite/core");
const { logOutput } = require("@lerna-lite/core");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
import { VersionCommand } from '../version-command';
const lernaVersion = require("@lerna-test/command-runner")(require("../../../cli/src/cli-commands/cli-version-commands"));

const yargParser = require('yargs-parser');
const dedent = require("dedent");

const createArgv = (cwd, ...args) => {
  args.unshift('version');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv;
};

describe.each([
  ["github", createGitHubClient],
  ["gitlab", createGitLabClient],
])("--create-release %s", (type, client) => {
  it("does not create a release if --no-push is passed", async () => {
    const cwd = await initFixture("independent");

    await new VersionCommand(createArgv(cwd, "--create-release", type, "--conventional-commits", "--no-push"));

    expect(client.releases.size).toBe(0);
  });

  it("throws an error if --conventional-commits is not passed", async () => {
    const cwd = await initFixture("independent");
    const command = new VersionCommand(createArgv(cwd, "--create-release", type));

    await expect(command).rejects.toThrow("To create a release, you must enable --conventional-commits");

    expect(client.releases.size).toBe(0);
  });

  it("throws an error if --no-changelog also passed", async () => {
    const cwd = await initFixture("independent");
    const command = new VersionCommand(createArgv(cwd, "--create-release", type, "--conventional-commits", "--no-changelog"));

    await expect(command).rejects.toThrow("To create a release, you cannot pass --no-changelog");

    expect(client.releases.size).toBe(0);
  });

  it("throws an error if environment variables are not present", async () => {
    const cwd = await initFixture("normal");
    const command = new VersionCommand(createArgv(cwd, "--create-release", type, "--conventional-commits"));
    const message = `Environment variables for ${type} are missing!`;

    client.mockImplementationOnce(() => {
      throw new Error(message);
    });

    await expect(command).rejects.toThrow(message);

    expect(client.releases.size).toBe(0);
  });

  it("marks a version as a pre-release if it contains a valid part", async () => {
    const cwd = await initFixture("normal");

    recommendVersion.mockResolvedValueOnce("2.0.0-alpha.1");

    await new VersionCommand(createArgv(cwd, "--create-release", type, "--conventional-commits"));

    expect(client.releases.size).toBe(1);
    expect(client.releases.get("v2.0.0-alpha.1")).toEqual({
      owner: "lerna",
      repo: "lerna",
      tag_name: "v2.0.0-alpha.1",
      name: "v2.0.0-alpha.1",
      body: "normal",
      draft: false,
      prerelease: true,
    });
  });

  it("creates a release for every independent version", async () => {
    const cwd = await initFixture("independent");
    const versionBumps = new Map([
      ["package-1", "1.0.1"],
      ["package-2", "2.1.0"],
      ["package-3", "4.0.0"],
      ["package-4", "4.1.0"],
      ["package-5", "5.0.1"],
    ]);

    versionBumps.forEach((bump) => recommendVersion.mockResolvedValueOnce(bump));

    await new VersionCommand(createArgv(cwd, "--create-release", type, "--conventional-commits"));

    expect(client.releases.size).toBe(5);
    versionBumps.forEach((version, name) => {
      expect(client.releases.get(`${name}@${version}`)).toEqual({
        owner: "lerna",
        repo: "lerna",
        tag_name: `${name}@${version}`,
        name: `${name}@${version}`,
        body: `${name} - ${version}`,
        draft: false,
        prerelease: false,
      });
    });
  });

  it("creates a single fixed release", async () => {
    const cwd = await initFixture("normal");

    recommendVersion.mockResolvedValueOnce("1.1.0");

    await new VersionCommand(createArgv(cwd, "--create-release", type, "--conventional-commits"));

    expect(client.releases.size).toBe(1);
    expect(client.releases.get("v1.1.0")).toEqual({
      owner: "lerna",
      repo: "lerna",
      tag_name: "v1.1.0",
      name: "v1.1.0",
      body: "normal",
      draft: false,
      prerelease: false,
    });
  });

  it("creates a single fixed release in git dry-run mode", async () => {
    const cwd = await initFixture("normal");

    recommendVersion.mockResolvedValueOnce("1.1.0");

    await new VersionCommand(createArgv(cwd, "--create-release", type, "--conventional-commits", "--git-dry-run"));

    expect(logOutput.logged()).toMatch(dedent`
    Changes (5 packages):
     - package-1: 1.0.0 => 1.1.0
     - package-2: 1.0.0 => 1.1.0
     - package-3: 1.0.0 => 1.1.0
     - package-4: 1.0.0 => 1.1.0
     - package-5: 1.0.0 => 1.1.0 (private)
    `);
  });
});

describe("legacy option --github-release", () => {
  it("is translated into --create-release=github", async () => {
    const cwd = await initFixture("normal");

    await lernaVersion(cwd)("--github-release", "--conventional-commits");

    expect(createGitHubClient.releases.size).toBe(1);
  });
});

describe("--create-release [unrecognized]", () => {
  it("throws an error", async () => {
    const cwd = await initFixture("normal");
    const command = new VersionCommand(createArgv(cwd, "--conventional-commits", "--create-release", "poopypants"));

    await expect(command).rejects.toThrow("Invalid release client type");

    expect(createGitHubClient.releases.size).toBe(0);
    expect(createGitLabClient.releases.size).toBe(0);
  });
});
