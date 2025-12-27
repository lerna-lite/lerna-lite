import { describe, expect, it, vi } from 'vitest';

import cliPublish from '../cli-publish-commands.js';

vi.mock('@lerna-lite/publish', () => null);

describe('Publish Command CLI options', () => {
  it('should log a console error when publishCommand is not provided', async () => {
    await expect(cliPublish.handler(undefined as any)).rejects.toThrow(
      new RegExp('"@lerna-lite/publish" is optional and was not found.')
    );
  });
});