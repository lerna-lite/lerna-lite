import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/diff', () => null);
import cliDiff from '../cli-diff-commands.js';

describe('DiffCommand CLI options', () => {
  it('should log a console error when DiffCommand is not provided', async () => {
    await expect(cliDiff.handler(undefined as any)).rejects.toThrow(new RegExp(`"@lerna-lite/diff" is optional and was not found.`));
  });
});
