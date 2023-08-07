import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/run', () => null);
import cliRun from '../cli-run-commands';

describe('RunCommand CLI options', () => {
  it('should log a console error when RunCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(cliRun.handler(undefined as any)).rejects.toMatchInlineSnapshot(
      '[Error: [vitest] vi.mock("@lerna-lite/run", factory?: () => unknown) is not returning an object. Did you mean to return an object with a "default" key?]'
    );

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/run" is optional and was not found.'), expect.anything());
  });
});
