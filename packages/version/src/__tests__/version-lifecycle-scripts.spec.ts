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
  createRunner: jest.requireActual('../../../core/src/__mocks__/run-lifecycle').createRunner,
  runLifecycle: jest.requireActual('../../../core/src/__mocks__/run-lifecycle').runLifecycle,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
}));

const yargParser = require('yargs-parser');
import { runLifecycle } from '@lerna-lite/core';
const loadJsonFile = require("load-json-file");
import 'dotenv/config';

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
import { VersionCommand } from '../version-command';

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('version');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv;
};

describe("lifecycle scripts", () => {
  const npmLifecycleEvent = process.env.npm_lifecycle_event;

  afterEach(() => {
    process.env.npm_lifecycle_event = npmLifecycleEvent;
  });

  it("calls version lifecycle scripts for root and packages", async () => {
    const cwd = await initFixture("lifecycle");

    await new VersionCommand(createArgv(cwd));

    expect(runLifecycle).toHaveBeenCalledTimes(6);

    ["preversion", "version", "postversion"].forEach((script) => {
      // "lifecycle" is the root manifest name
      expect(runLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "lifecycle" }),
        script,
        expect.any(Object)
      );
      expect(runLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        script,
        expect.any(Object)
      );
    });

    // package-2 lacks version lifecycle scripts
    expect(runLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-2" }),
      expect.any(String)
    );

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      ["lifecycle", "preversion"],
      ["package-1", "preversion"],
      ["package-1", "version"],
      ["lifecycle", "version"],
      ["package-1", "postversion"],
      ["lifecycle", "postversion"],
    ]);

    expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual([
      "/packages/package-1",
      "/packages/package-2",
      "/" // `package-lock.json` project root location
    ]);
  });

  it("does not execute recursive root scripts", async () => {
    const cwd = await initFixture("lifecycle");

    process.env.npm_lifecycle_event = "version";

    await new VersionCommand(createArgv(cwd));

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      ["package-1", "preversion"],
      ["package-1", "version"],
      ["package-1", "postversion"],
    ]);
  });

  it("does not duplicate rooted leaf scripts", async () => {
    const cwd = await initFixture("lifecycle-rooted-leaf");

    await new VersionCommand(createArgv(cwd));

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      ["package-1", "preversion"],
      ["package-1", "version"],
      ["lifecycle-rooted-leaf", "preversion"],
      ["lifecycle-rooted-leaf", "version"],
      ["lifecycle-rooted-leaf", "postversion"],
      ["package-1", "postversion"],
    ]);
  });

  it("respects --ignore-scripts", async () => {
    const cwd = await initFixture("lifecycle");

    await new VersionCommand(createArgv(cwd, "--ignore-scripts"));

    // despite all the scripts being passed to runLifecycle()
    // none of them will actually execute as long as opts["ignore-scripts"] is provided
    expect(runLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "lifecycle" }),
      "version",
      expect.objectContaining({
        "ignore-scripts": true,
      })
    );
  });
});
