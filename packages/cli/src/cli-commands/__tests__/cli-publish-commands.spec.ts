import { PublishCommand } from '@lerna-lite/publish';
import { describe, expect, it, vi, type Mock } from 'vitest';

import cliPublish from '../cli-publish-commands.js';

vi.mock('@lerna-lite/publish', () => ({ PublishCommand: vi.fn(function () {}) }));

describe('Publish Command CLI options', () => {
  it('should log a console error when publishCommand is not provided', async () => {
    (PublishCommand as unknown as Mock).mockImplementationOnce(function () {
      throw new Error('missing command');
    });
    await expect(cliPublish.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/publish" is optional and was not found.'));
  });

  it('preserves command failures and their exit codes', async () => {
    const error = Object.assign(new Error('publish failed'), { exitCode: 7 });
    (PublishCommand as unknown as Mock).mockImplementationOnce(function () {
      return { runner: Promise.reject(error) };
    });
    await expect(cliPublish.handler({} as any)).rejects.toBe(error);
  });
});
