import { RunCommand } from '@lerna-lite/run';
import { describe, expect, it, vi, type Mock } from 'vitest';

import cliRun from '../cli-run-commands.js';

vi.mock('@lerna-lite/run', () => ({ RunCommand: vi.fn(function () {}) }));

describe('RunCommand CLI options', () => {
  it('should log a console error when RunCommand is not provided', async () => {
    (RunCommand as unknown as Mock).mockImplementationOnce(function () {
      throw new Error('missing command');
    });
    await expect(cliRun.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/run" is optional and was not found.'));
  });

  it('awaits command completion and preserves execution errors', async () => {
    const error = Object.assign(new Error('command failed'), { exitCode: 7 });
    (RunCommand as unknown as Mock).mockImplementationOnce(function () {
      return { runner: Promise.reject(error) };
    });
    await expect(cliRun.handler({} as any)).rejects.toBe(error);
  });
});
