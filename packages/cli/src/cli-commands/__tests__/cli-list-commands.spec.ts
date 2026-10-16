import { ListCommand } from '@lerna-lite/list';
import { describe, expect, it, vi, type Mock } from 'vitest';

import cliList from '../cli-list-commands.js';

vi.mock('@lerna-lite/list', () => ({ ListCommand: vi.fn(function () {}) }));

describe('ListCommand CLI options', () => {
  it('should log a console error when ListCommand is not provided', async () => {
    (ListCommand as unknown as Mock).mockImplementationOnce(function () {
      throw new Error('missing command');
    });
    await expect(cliList.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/list" is optional and was not found.'));
  });

  it('awaits command completion and preserves execution errors', async () => {
    const error = Object.assign(new Error('command failed'), { exitCode: 7 });
    (ListCommand as unknown as Mock).mockImplementationOnce(function () {
      return { runner: Promise.reject(error) };
    });
    await expect(cliList.handler({} as any)).rejects.toBe(error);
  });
});
