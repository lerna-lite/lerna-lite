"use strict";

const execa = require("execa");

const cloneFixture = require("@lerna-test/clone-fixture")(__dirname);
const { gitPush } = require("../lib/git-push");

async function listRemoteTags(cwd) {
  return execa("git", ["ls-remote", "--tags", "--refs", "--quiet"], { cwd }).then((result) => result.stdout);
}

import { exec } from '@lerna-lite/core';
jest.mock('@lerna-lite/core', () => {
  const { exec } = jest.requireActual('@lerna-lite/core')
  return {
    __esModule: true,
    exec: jest.fn(exec)
  }
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.GIT_REDIRECT_STDERR;
});

test("gitPush", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");
  // const execSpy = jest.spyOn(coreModule, "exec");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v1.2.3", "-m", "v1.2.3"], { cwd });
  await execa("git", ["tag", "foo@2.3.1", "-m", "foo@2.3.1"], { cwd });
  await execa("git", ["tag", "bar@3.2.1", "-m", "bar@3.2.1"], { cwd });

  await gitPush("origin", "main", { cwd });

  expect(exec).toHaveBeenCalled();
  expect(exec).toHaveBeenLastCalledWith(
    "git",
    ["push", "--follow-tags", "--no-verify", "--atomic", "origin", "main"],
    { cwd },
    false
  );

  const list = await listRemoteTags(cwd);
  expect(list).toMatch("v1.2.3");
  expect(list).toMatch("foo@2.3.1");
  expect(list).toMatch("bar@3.2.1");
});

test("remote that does not support --atomic", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v4.5.6", "-m", "v4.5.6"], { cwd });

  // the first time the command is executed, simulate remote error
  (exec as any).mockImplementationOnce(async () => {
    const stderr = "fatal: the receiving end does not support --atomic push";
    const error: any = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin main", stderr].join("\n")
    );

    error.stderr = stderr;

    throw error;
  });

  // this call should _not_ throw
  await gitPush("origin", "main", { cwd });

  expect(exec).toHaveBeenCalledTimes(2);
  expect(exec).toHaveBeenLastCalledWith(
    "git",
    ["push", "--follow-tags", "--no-verify", "origin", "main"],
    { cwd },
    false
  );

  const list = await listRemoteTags(cwd);
  expect(list).toMatch("v4.5.6");
});

test("remote that does not support --atomic and git stderr redirected to stdout", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  process.env.GIT_REDIRECT_STDERR = "2>&1";

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v4.5.6", "-m", "v4.5.6"], { cwd });

  // the first time the command is executed, simulate remote error
  (exec as any).mockImplementationOnce(async () => {
    const stdout = "fatal: the receiving end does not support --atomic push";
    const error: any = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin main", stdout].join("\n")
    );

    error.stdout = stdout;

    throw error;
  });

  // this call should _not_ throw
  await gitPush("origin", "main", { cwd });

  expect((exec as any)).toHaveBeenCalledTimes(2);
  expect((exec as any)).toHaveBeenLastCalledWith(
    "git",
    ["push", "--follow-tags", "--no-verify", "origin", "main"],
    { cwd },
    false
  );

  const list = await listRemoteTags(cwd);
  expect(list).toMatch("v4.5.6");
});

test("git cli that does not support --atomic", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["tag", "v7.8.9", "-m", "v7.8.9"], { cwd });

  // the first time the command is executed, simulate remote error
  // (exec as any).mockImplementationOnce(async () => {
  //   const stderr = "error: unknown option `atomic'";
  //   const error: any = new Error(
  //     ["Command failed: git push --follow-tags --atomic --no-verify origin master", stderr].join("\n")
  //   );

  //   error.stderr = stderr;

  //   throw error;
  // });

  await gitPush("origin", "main", { cwd });

  await expect(listRemoteTags(cwd)).resolves.toMatch("v7.8.9");
});

test("unexpected git error", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  (exec as any).mockImplementationOnce(async () => {
    const stderr = "fatal: some unexpected error";
    const error: any = new Error(
      ["Command failed: git push --follow-tags --atomic --no-verify origin main", stderr].join("\n")
    );

    error.stderr = stderr;

    throw error;
  });

  await expect(gitPush("origin", "main", { cwd })).rejects.toThrowError(/some unexpected error/);
});
