import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { x } from 'tinyexec';
import { expect, it, vi } from 'vitest';

import { PublishCommand } from '../publish-command.js';

it('rejects a dirty tracked file in the repository being published', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'lerna-publish-tree-'));
  const git = (args: string[]) => x('git', args, { nodeOptions: { cwd }, throwOnError: true });
  const warn = vi.fn();
  const check = (allowDirty?: boolean) =>
    PublishCommand.prototype.verifyWorkingTreeClean.call({
      execOpts: { cwd },
      options: { dryRun: false, allowDirty },
      logger: { warn },
    } as PublishCommand);

  try {
    await git(['init']);
    await writeFile(join(cwd, 'tracked.txt'), 'original\n');
    await git(['add', 'tracked.txt']);
    await git(['-c', 'user.name=Lerna Test', '-c', 'user.email=lerna@example.test', 'commit', '-m', 'fixture']);

    await expect(check()).resolves.toBeUndefined();
    await writeFile(join(cwd, 'tracked.txt'), 'modified\n');
    await expect(check()).rejects.toThrow('tracked.txt');
    await expect(check(false)).rejects.toThrow('tracked.txt');
    await expect(check(true)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('allow-dirty', expect.stringContaining('uncommitted changes'));

    await git(['add', 'tracked.txt']);
    await expect(check()).rejects.toThrow('tracked.txt');
    await expect(check(true)).resolves.toBeUndefined();
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
