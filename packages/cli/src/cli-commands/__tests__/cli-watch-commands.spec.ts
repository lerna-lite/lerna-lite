import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/watch', () => null);
import cliWatch from '../cli-watch-commands';

describe('Watch Command CLI options', () => {
  it('should log a console error when watchCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(cliWatch.handler(undefined as any)).rejects.toMatchInlineSnapshot(
      '[Error: [vitest] vi.mock("@lerna-lite/watch", factory?: () => unknown) is not returning an object. Did you mean to return an object with a "default" key?]'
    );

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/watch" is optional and was not found.'), expect.anything());
  });
});
