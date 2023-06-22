import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/create', () => null);
import cliCreate from '../cli-create-command';

describe('CreateCommand CLI options', () => {
  it('should log a console error when CreateCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cliCreate.handler(undefined as any);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/create" is optional and was not found.'), expect.anything());
  });
});
