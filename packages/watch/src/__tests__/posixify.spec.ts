import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { WatchCommand } from '../watch-command.js';

test('posixifyPath normalizes windows-style paths and _watchedFiles contains POSIX entries', () => {
  const testDir = mkdtempSync(join(tmpdir(), 'watch-test-'));

  try {
    const pkg1 = join(testDir, 'packages', 'package-1');
    const pkg2 = join(testDir, 'packages', 'package-2');

    // create minimal package files so glob finds something
    mkdirSync(join(pkg1, 'src'), { recursive: true });
    mkdirSync(join(pkg2, 'src'), { recursive: true });
    writeFileSync(join(pkg1, 'src', 'file1.txt'), 'x');
    writeFileSync(join(pkg2, 'src', 'file2.txt'), 'y');

    const cmd = new WatchCommand({} as any);
    (cmd as any).options = {};
    (cmd as any).project = { rootPath: testDir };
    (cmd as any)._filteredPackages = [
      { location: join(testDir, 'packages', 'package-1'), name: 'package-1' },
      { location: join(testDir, 'packages', 'package-2'), name: 'package-2' },
    ];

    // direct posixify behavior
    expect((cmd as any).posixifyPath('a\\b\\c')).toBe('a/b/c');

    // Add events populate the inventory incrementally; no filesystem rescan is needed.
    (cmd as any)._ready = true;
    (cmd as any).handleFileEvent('add', join(pkg1, 'src', 'file1.txt'));
    (cmd as any).handleFileEvent('add', join(pkg2, 'src', 'file2.txt'));

    const watchedFiles = Array.from(cmd.watchedFiles);
    expect(watchedFiles).toEqual(['packages/package-1/src/file1.txt', 'packages/package-2/src/file2.txt']);
    for (const p of watchedFiles) {
      expect(p).not.toContain('\\');
    }
  } finally {
    rmSync(testDir, { recursive: true, force: true });
  }
});
