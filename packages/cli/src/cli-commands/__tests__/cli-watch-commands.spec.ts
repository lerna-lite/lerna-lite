import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/watch', () => null);
import cliWatch from '../cli-watch-commands';

describe('Watch Command CLI options', () => {
  it('should log a console error when watchCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cliWatch.handler(undefined as any);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/watch" is optional and was not found.'), expect.anything());
  });
});
