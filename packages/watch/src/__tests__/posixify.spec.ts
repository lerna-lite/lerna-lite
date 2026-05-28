import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { WatchCommand } from '../watch-command.js';

test('posixifyPath normalizes windows-style paths and _watchedFiles contains POSIX entries', () => {
  const testDir = mkdtempSync(join(tmpdir(), 'watch-test-'));

  const pkg1 = join(testDir, 'packages', 'package-1');
  const pkg2 = join(testDir, 'packages', 'package-2');

  // create minimal package files so glob finds something
  mkdirSync(join(pkg1, 'src'), { recursive: true });
  mkdirSync(join(pkg2, 'src'), { recursive: true });
  writeFileSync(join(pkg1, 'src', 'file1.txt'), 'x');
  writeFileSync(join(pkg2, 'src', 'file2.txt'), 'y');

  const cmd = new WatchCommand({} as any);
  (cmd as any).project = { rootPath: testDir };
  (cmd as any)._filteredPackages = [
    { location: join(testDir, 'packages', 'package-1'), name: 'package-1' },
    { location: join(testDir, 'packages', 'package-2'), name: 'package-2' },
  ];

  // direct posixify behavior
  expect((cmd as any).posixifyPath('a\\b\\c')).toBe('a/b/c');

  // regenerate watch paths and assert normalization
  (cmd as any).regenerateWatchGlobPaths();

  const watchedFiles = Array.from((cmd as any)._watchedFiles as Set<string>);
  expect(watchedFiles.length).toBeGreaterThan(0);
  for (const p of watchedFiles) {
    expect(p).not.toContain('\\');
  }
});
