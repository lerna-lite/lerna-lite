import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/publish', () => null);
import cliPublish from '../cli-publish-commands';

describe('Publish Command CLI options', () => {
  it('should log a console error when publishCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(cliPublish.handler(undefined as any)).rejects.toMatchInlineSnapshot(
      '[Error: [vitest] vi.mock("@lerna-lite/publish", factory?: () => unknown) is not returning an object. Did you mean to return an object with a "default" key?]'
    );

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/publish" is optional and was not found.'), expect.anything());
  });
});
