import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/list', () => null);
import cliList from '../cli-list-commands';

describe('ListCommand CLI options', () => {
  it('should log a console error when ListCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cliList.handler(undefined as any);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/list" is optional and was not found.'), expect.anything());
  });
});
