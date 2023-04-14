import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/run', () => null);
import cliRun from '../cli-run-commands';

describe('RunCommand CLI options', () => {
  it('should log a console error when RunCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await cliRun.handler(undefined as any);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/run" is optional and was not found.'), expect.anything());
  });
});
