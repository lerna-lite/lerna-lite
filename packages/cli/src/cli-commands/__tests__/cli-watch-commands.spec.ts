import { WatchCommand } from '@lerna-lite/watch';
import { describe, expect, it, vi, type Mock } from 'vitest';

import cliWatch from '../cli-watch-commands.js';

vi.mock('@lerna-lite/watch', () => ({ WatchCommand: vi.fn(function () {}) }));

describe('Watch Command CLI options', () => {
  it('should log a console error when watchCommand is not provided', async () => {
    (WatchCommand as unknown as Mock).mockImplementationOnce(function () {
      throw new Error('missing command');
    });
    await expect(cliWatch.handler(undefined as any)).rejects.toThrow(
      new RegExp('"@lerna-lite/watch" is optional and was not found. Please install it with "npm install @lerna-lite/watch -D"')
    );
  });

  it('awaits startup and preserves initialization errors', async () => {
    const error = Object.assign(new Error('startup failed'), { exitCode: 7 });
    (WatchCommand as unknown as Mock).mockImplementationOnce(function () {
      return { runner: Promise.reject(error) };
    });
    await expect(cliWatch.handler({} as any)).rejects.toBe(error);
  });
});
