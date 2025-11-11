import { describe, expect, it, vi } from 'vitest';

import cliWatch from '../cli-watch-commands.js';

vi.mock('@lerna-lite/watch', () => null);

describe('Watch Command CLI options', () => {
  it('should log a console error when watchCommand is not provided', async () => {
    await expect(cliWatch.handler(undefined as any)).rejects.toThrow(
      new RegExp('"@lerna-lite/watch" is optional and was not found. Please install it with "npm install @lerna-lite/watch -D"')
    );
  });
});
