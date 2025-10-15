import { describe, expect, it, vi } from 'vitest';
import cliChanged from '../cli-changed-commands.js';

vi.mock('@lerna-lite/changed', () => null);

describe('ChangedCommand CLI options', () => {
  it('should log a console error when ChangedCommand is not provided', async () => {
    await expect(cliChanged.handler(undefined as any)).rejects.toThrow(new RegExp(`"@lerna-lite/changed" is optional and was not found`));
  });
});
