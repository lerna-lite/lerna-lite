import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { x } from 'tinyexec';
import { expect, it, vi } from 'vitest';

import { PublishCommand } from '../publish-command.js';

it('rejects a dirty tracked file in the repository being published', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'lerna-publish-tree-'));
  const git = (args: string[]) => x('git', args, { nodeOptions: { cwd }, throwOnError: true });
  const warn = vi.fn();
  const check = (allowDirty?: boolean | string | string[]) =>
    PublishCommand.prototype.verifyWorkingTreeClean.call({
      execOpts: { cwd },
      options: { dryRun: false, allowDirty },
      logger: { warn },
    } as PublishCommand);

  try {
    await git(['init']);
    await mkdir(join(cwd, 'nested'));
    await writeFile(join(cwd, 'README.md'), 'original\n');
    await writeFile(join(cwd, 'nested', 'notes with spaces.md'), 'original\n');
    await writeFile(join(cwd, 'tracked.txt'), 'original\n');
    await git(['add', '.']);
    await git(['-c', 'user.name=Lerna Test', '-c', 'user.email=lerna@example.test', 'commit', '-m', 'fixture']);

    await expect(check()).resolves.toBeUndefined();
    await expect(check('**/*.md')).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
    await writeFile(join(cwd, 'README.md'), 'modified\n');
    await writeFile(join(cwd, 'nested', 'notes with spaces.md'), 'modified\n');
    await expect(check('**/*.md')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('allow-dirty', expect.stringContaining('nested/notes with spaces.md'));
    await git(['add', 'README.md']);
    await expect(check('**/*.md')).resolves.toBeUndefined();
    await expect(check([])).rejects.toThrow('README.md');
    await writeFile(join(cwd, 'untracked.js'), 'untracked\n');
    await expect(check('**/*.md')).resolves.toBeUndefined();
    await writeFile(join(cwd, 'tracked.txt'), 'modified\n');
    await expect(check(['**/*.md'])).rejects.toThrow('tracked.txt');
    await expect(check(['**/*.md', '**/*.txt'])).resolves.toBeUndefined();
    await expect(check()).rejects.toThrow('tracked.txt');
    await expect(check(false)).rejects.toThrow('tracked.txt');
    await expect(check(true)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('allow-dirty', expect.stringContaining('uncommitted changes'));

    await git(['add', 'tracked.txt']);
    await expect(check()).rejects.toThrow('tracked.txt');
    await expect(check(['**/*.md'])).rejects.toThrow('tracked.txt');
    await expect(check(['**/*.md', '**/*.txt'])).resolves.toBeUndefined();
    await expect(check(true)).resolves.toBeUndefined();
    await git(['add', 'README.md']);
    await git(['mv', 'README.md', 'renamed.txt']);
    await expect(check(['**/*.md'])).rejects.toThrow('renamed.txt');
    await expect(check(['**/*.md', '**/*.txt'])).resolves.toBeUndefined();
    // Commit the content changes so Git detects the next move as a rename.
    await git(['add', '-u']);
    await git(['-c', 'user.name=Lerna Test', '-c', 'user.email=lerna@example.test', 'commit', '-m', 'updated fixture']);
    await git(['mv', 'tracked.txt', 'moved.md']);
    await expect(check(['**/*.md', 'renamed.txt'])).rejects.toThrow('moved.md <- tracked.txt');
    await expect(check(['**/*.md', '**/*.txt'])).resolves.toBeUndefined();
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
