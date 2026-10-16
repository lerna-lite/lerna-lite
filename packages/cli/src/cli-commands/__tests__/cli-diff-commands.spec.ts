import { DiffCommand } from '@lerna-lite/diff';
import { describe, expect, it, vi, type Mock } from 'vitest';

import cliDiff from '../cli-diff-commands.js';

vi.mock('@lerna-lite/diff', () => ({ DiffCommand: vi.fn(function () {}) }));

describe('DiffCommand CLI options', () => {
  it('should log a console error when DiffCommand is not provided', async () => {
    (DiffCommand as unknown as Mock).mockImplementationOnce(function () {
      throw new Error('missing command');
    });
    await expect(cliDiff.handler(undefined as any)).rejects.toThrow(new RegExp(`"@lerna-lite/diff" is optional and was not found.`));
  });

  it('awaits command completion and preserves execution errors', async () => {
    const error = Object.assign(new Error('command failed'), { exitCode: 7 });
    (DiffCommand as unknown as Mock).mockImplementationOnce(function () {
      return { runner: Promise.reject(error) };
    });
    await expect(cliDiff.handler({} as any)).rejects.toBe(error);
  });
});
