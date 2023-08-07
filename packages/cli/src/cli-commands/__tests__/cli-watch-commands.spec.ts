import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/watch', () => null);
import cliWatch from '../cli-watch-commands';

describe('Watch Command CLI options', () => {
  it('should log a console error when watchCommand is not provided', async () => {
    await expect(cliWatch.handler(undefined as any)).rejects.toThrow(
      new RegExp('"@lerna-lite/watch" is optional and was not found. Please install it with "npm install @lerna-lite/watch -D"')
    );
  });
});
