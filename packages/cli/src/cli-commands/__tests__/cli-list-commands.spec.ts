import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/list', () => null);
import cliList from '../cli-list-commands.js';

describe('ListCommand CLI options', () => {
  it('should log a console error when ListCommand is not provided', async () => {
    await expect(cliList.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/list" is optional and was not found.'));
  });
});
