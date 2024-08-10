import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/publish', () => null);
import cliPublish from '../cli-publish-commands.js';

describe('Publish Command CLI options', () => {
  it('should log a console error when publishCommand is not provided', async () => {
    await expect(cliPublish.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/publish" is optional and was not found.'));
  });
});
