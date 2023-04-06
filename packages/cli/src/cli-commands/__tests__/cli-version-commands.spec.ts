import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/version', () => null);
import cliVersion from '../cli-version-commands';

describe('Version Command CLI options', () => {
  it('should log a console error when versionCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cliVersion.handler(undefined as any);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/version" is optional and was not found.'), expect.anything());
  });
});
