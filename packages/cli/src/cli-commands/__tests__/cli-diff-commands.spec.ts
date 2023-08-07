import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/diff', () => null);
import cliDiff from '../cli-diff-commands';

describe('DiffCommand CLI options', () => {
  it('should log a console error when DiffCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(cliDiff.handler(undefined as any)).rejects.toMatchInlineSnapshot(
      '[Error: [vitest] vi.mock("@lerna-lite/diff", factory?: () => unknown) is not returning an object. Did you mean to return an object with a "default" key?]'
    );

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`"@lerna-lite/diff" is optional and was not found.`), expect.anything());
  });
});
