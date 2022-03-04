"use strict";

import { exec } from '@lerna-lite/core';

const { gitTag } = require("../lib/git-tag");

jest.mock('@lerna-lite/core', () => {
  const { exec } = jest.requireActual('@lerna-lite/core')
  return {
    __esModule: true,
    exec: jest.fn(exec)
  }
});

describe("gitTag", () => {
  (exec as any).mockResolvedValue();

  it("creates an annotated git tag", async () => {
    const tag = "v1.2.3";
    const opts = { cwd: "default" };

    await gitTag(tag, {}, opts);

    expect(exec).toHaveBeenLastCalledWith("git", ["tag", tag, "-m", tag], opts, false);
  });

  it("signs the tag when configured", async () => {
    const tag = "v3.2.1";
    const opts = { cwd: "signed" };

    await gitTag(tag, { signGitTag: true }, opts);

    expect(exec).toHaveBeenLastCalledWith("git", ["tag", tag, "-m", tag, "--sign"], opts, false);
  });

  it("forces the tag when configured", async () => {
    const tag = "v1.1.1";
    const opts = { cwd: "forced" };

    await gitTag(tag, { forceGitTag: true }, opts);

    expect(exec).toHaveBeenLastCalledWith("git", ["tag", tag, "-m", tag, "--force"], opts, false);
  });
});
