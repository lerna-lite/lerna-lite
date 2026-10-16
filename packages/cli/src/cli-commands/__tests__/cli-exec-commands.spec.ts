import { ExecCommand } from '@lerna-lite/exec';
import { describe, expect, it, vi, type Mock } from 'vitest';

import cliExec from '../cli-exec-commands.js';

vi.mock('@lerna-lite/exec', () => ({ ExecCommand: vi.fn(function () {}) }));

describe('ExecCommand CLI options', () => {
  it('should log a console error when ExecCommand is not provided', async () => {
    (ExecCommand as unknown as Mock).mockImplementationOnce(function () {
      throw new Error('missing command');
    });
    await expect(cliExec.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/exec" is optional and was not found.'));
  });

  it('awaits command completion and preserves execution errors', async () => {
    const error = Object.assign(new Error('command failed'), { exitCode: 7 });
    (ExecCommand as unknown as Mock).mockImplementationOnce(function () {
      return { runner: Promise.reject(error) };
    });
    await expect(cliExec.handler({} as any)).rejects.toBe(error);
  });
});
