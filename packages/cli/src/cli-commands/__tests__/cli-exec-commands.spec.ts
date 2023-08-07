import { describe, expect, it, vi } from 'vitest';

vi.mock('@lerna-lite/exec', () => null);
import cliExec from '../cli-exec-commands';

describe('ExecCommand CLI options', () => {
  it('should log a console error when ExecCommand is not provided', async () => {
    await expect(cliExec.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/exec" is optional and was not found.'));
  });
});
