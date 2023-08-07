import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/list', () => null);
import cliList from '../cli-list-commands';

describe('ListCommand CLI options', () => {
  it('should log a console error when ListCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(cliList.handler(undefined as any)).rejects.toMatchInlineSnapshot(
      '[Error: [vitest] vi.mock("@lerna-lite/list", factory?: () => unknown) is not returning an object. Did you mean to return an object with a "default" key?]'
    );

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/list" is optional and was not found.'), expect.anything());
  });
});
