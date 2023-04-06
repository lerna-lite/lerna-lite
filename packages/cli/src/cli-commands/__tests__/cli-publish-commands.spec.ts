import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/publish', () => null);
import cliPublish from '../cli-publish-commands';

describe('Publish Command CLI options', () => {
  it('should log a console error when publishCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cliPublish.handler(undefined as any);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/publish" is optional and was not found.'), expect.anything());
  });
});
