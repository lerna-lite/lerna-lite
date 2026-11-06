import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { exec } from '@lerna-lite/core';
import { x } from 'tinyexec';
import { expect, it, vi } from 'vitest';

import { PublishCommand } from '../publish-command.js';

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  exec: vi.fn().mockResolvedValue({ stdout: '' }),
}));

it('rejects a dirty tree when the filtered status unexpectedly contains no entries', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'lerna-publish-tree-fallback-'));
  const git = (args: string[]) => x('git', args, { nodeOptions: { cwd }, throwOnError: true });
  const warn = vi.fn();

  try {
    await git(['init']);
    await writeFile(join(cwd, 'tracked.txt'), 'original\n');
    await git(['add', 'tracked.txt']);
    await git(['-c', 'user.name=Lerna Test', '-c', 'user.email=lerna@example.test', 'commit', '-m', 'fixture']);
    await writeFile(join(cwd, 'tracked.txt'), 'modified\n');

    const check = PublishCommand.prototype.verifyWorkingTreeClean.call({
      execOpts: { cwd },
      options: { dryRun: false, allowDirty: '**/*.md' },
      logger: { warn },
    } as unknown as PublishCommand);

    await expect(check).rejects.toMatchObject({ name: 'ValidationError', message: expect.stringContaining('tracked.txt') });
    expect(exec).toHaveBeenCalledWith('git', ['status', '--porcelain', '-z', '--untracked-files=no'], { cwd });
    expect(warn).not.toHaveBeenCalled();
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
