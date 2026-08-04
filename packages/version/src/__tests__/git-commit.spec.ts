import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';

import { exec } from '@lerna-lite/core';
import { describe, expect, test, vi } from 'vitest';

import type { GitCommitOption } from '../interfaces.js';
import { gitCommit } from '../lib/git-commit.js';
import { tempWrite } from '../utils/temp-write.js';

vi.mock('@lerna-lite/core');
vi.mock('../utils/temp-write');

describe('git commit', () => {
  (exec as any).mockResolvedValue(null);
  (tempWrite.sync as any).mockReturnValue('temp-file-path');

  test('--message', async () => {
    const opts = { cwd: 'message' };
    await gitCommit('subject', {} as GitCommitOption, opts);
    expect(exec).toHaveBeenLastCalledWith('git', ['commit', '-m', 'subject'], opts, false);
  });

  test('--message <multiline>', async () => {
    const message = `subject${EOL}${EOL}body`;
    const opts = { cwd: 'multi-line' };
    await gitCommit(message, {} as GitCommitOption, opts);
    expect(tempWrite.sync).toHaveBeenLastCalledWith(message, 'lerna-commit.txt');
    expect(exec).toHaveBeenLastCalledWith('git', ['commit', '-F', 'temp-file-path'], opts, false);
  });

  test('--message <multiline> uses an absolute, readable temp file at exec time', async () => {
    const message = `subject${EOL}${EOL}body`;
    const opts = { cwd: 'multi-line-absolute' };
    const tempRoot = mkdtempSync(join(tmpdir(), 'lerna-commit-test-'));
    const commitFile = join(tempRoot, 'lerna-commit.txt');

    (tempWrite.sync as any).mockImplementationOnce((content: string, filename: string) => {
      expect(filename).toBe('lerna-commit.txt');
      writeFileSync(commitFile, content);
      return commitFile;
    });

    (exec as any).mockImplementationOnce((_bin, args) => {
      const tempPath = args[2];
      expect(isAbsolute(tempPath)).toBe(true);
      expect(readFileSync(tempPath, 'utf8')).toBe(message);
      return Promise.resolve(null);
    });

    await gitCommit(message, {} as GitCommitOption, opts);

    expect(exec).toHaveBeenLastCalledWith('git', ['commit', '-F', commitFile], opts, false);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  test('--amend', async () => {
    const opts = { cwd: 'no-edit' };
    await gitCommit('whoops', { amend: true } as GitCommitOption, opts);
    expect(exec).toHaveBeenLastCalledWith('git', ['commit', '--amend', '--no-edit'], opts, false);
  });

  test('--no-commit-hooks', async () => {
    const opts = { cwd: 'no-verify' };
    await gitCommit('yolo', { commitHooks: false } as GitCommitOption, opts);
    expect(exec).toHaveBeenLastCalledWith('git', ['commit', '--no-verify', '-m', 'yolo'], opts, false);
  });

  test('--sign-git-commit', async () => {
    const opts = { cwd: 'signed' };
    await gitCommit('nice', { signGitCommit: true } as GitCommitOption, opts);
    expect(exec).toHaveBeenLastCalledWith('git', ['commit', '--gpg-sign', '-m', 'nice'], opts, false);
  });

  test('--signoff-git-commit', async () => {
    const opts = { cwd: 'signed-off' };
    await gitCommit('nice', { signoffGitCommit: true } as GitCommitOption, opts);
    expect(exec).toHaveBeenLastCalledWith('git', ['commit', '--signoff', '-m', 'nice'], opts, false);
  });
});
