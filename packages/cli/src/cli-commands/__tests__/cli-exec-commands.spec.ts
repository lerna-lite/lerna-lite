import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/exec', () => null);
import cliExec from '../cli-exec-commands';

describe('ExecCommand CLI options', () => {
  it('should log a console error when ExecCommand is not provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(cliExec.handler(undefined as any)).rejects.toMatchInlineSnapshot(
      '[Error: [vitest] vi.mock("@lerna-lite/exec", factory?: () => unknown) is not returning an object. Did you mean to return an object with a "default" key?]'
    );

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"@lerna-lite/exec" is optional and was not found.'), expect.anything());
  });
});
