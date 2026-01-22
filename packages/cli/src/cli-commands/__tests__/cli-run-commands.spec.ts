import { describe, expect, it, vi } from 'vitest';

import cliRun from '../cli-run-commands.js';

vi.mock('@lerna-lite/run', () => null);

describe('RunCommand CLI options', () => {
  it('should log a console error when RunCommand is not provided', async () => {
    await expect(cliRun.handler(undefined as any)).rejects.toThrow(new RegExp('"@lerna-lite/run" is optional and was not found.'));
  });
});
