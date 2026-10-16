import { ChangedCommand } from '@lerna-lite/changed';
import { describe, expect, it, vi, type Mock } from 'vitest';

import cliChanged from '../cli-changed-commands.js';

vi.mock('@lerna-lite/changed', () => ({ ChangedCommand: vi.fn(function () {}) }));

describe('ChangedCommand CLI options', () => {
  it('should log a console error when ChangedCommand is not provided', async () => {
    (ChangedCommand as unknown as Mock).mockImplementationOnce(function () {
      throw new Error('missing command');
    });
    await expect(cliChanged.handler(undefined as any)).rejects.toThrow(new RegExp(`"@lerna-lite/changed" is optional and was not found`));
  });

  it('awaits command completion and preserves execution errors', async () => {
    const error = Object.assign(new Error('command failed'), { exitCode: 7 });
    (ChangedCommand as unknown as Mock).mockImplementationOnce(function () {
      return { runner: Promise.reject(error) };
    });
    await expect(cliChanged.handler({} as any)).rejects.toBe(error);
  });
});
