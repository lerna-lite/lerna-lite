import { describe, expect, it, vi, afterEach } from 'vitest';

// Mock node:fs before importing the module under test to allow replacing
// functions like globSync which are non-configurable in ESM module namespace.
vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs');
  return {
    ...actual,
    globSync: vi.fn((_pattern: any, _opts: any) => ['pkg1/file.txt', 'pkg2/file.txt', 'pkg-link/file.txt']),
    lstatSync: vi.fn((p: any) => ({ isSymbolicLink: () => String(p).includes('pkg-link') })),
    statSync: vi.fn((p: any) => ({ isDirectory: () => String(p).includes('pkg1') })),
  } as any;
});

import { isAbsolute } from 'node:path';

import { makeSyncFileFinder } from '../../project/lib/make-file-finder.js';

describe('make-file-finder (native glob adapter)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when package config uses ** and node_modules', () => {
    expect(() => makeSyncFileFinder('/root', ['node_modules/**'])).toThrow(/node_modules/);
  });

  it('filters symlinks and non-directories correctly and returns absolute paths when requested', () => {
    const root = '/tmp/project';
    const packageConfigs = ['packages/*'];
    const finder = makeSyncFileFinder(root, packageConfigs);

    // The mocked node:fs implementation above applies
    const results = finder('file.txt', (v) => v, { cwd: root, onlyDirectories: true, followSymbolicLinks: false, absolute: true } as any);

    // Should only include pkg1 (pkg2 is file, pkg-link filtered due to symlink)
    expect(results.length).toBeGreaterThan(0);
    // Use path.isAbsolute so tests work on Windows and POSIX
    expect(results.every((r) => isAbsolute(r))).toBe(true);
    expect(results.some((r) => r.includes('pkg1'))).toBe(true);
    expect(results.every((r) => !r.includes('pkg-link'))).toBe(true);
  });

  it('forwards caseSensitiveMatch to the native glob options', async () => {
    const fs = await import('node:fs');
    const root = '/tmp/project';
    const packageConfigs = ['packages/*'];
    const finder = makeSyncFileFinder(root, packageConfigs);

    // call with caseSensitiveMatch set
    finder('file.txt', undefined as any, { cwd: root, caseSensitiveMatch: true } as any);

    expect((fs as any).globSync).toHaveBeenCalled();
    const calledOpts = (fs as any).globSync.mock.calls[0][1];
    expect(calledOpts.caseSensitiveMatch).toBe(true);
  });

  it('does not lstat when followSymbolicLinks is not false (explicit override)', async () => {
    const root = '/tmp/project';
    const packageConfigs = ['packages/*'];
    const finder = makeSyncFileFinder(root, packageConfigs);

    // pass followSymbolicLinks: true via custom options (overrides defaults)
    const results = finder('file.txt', undefined as any, { cwd: root, followSymbolicLinks: true } as any);

    // globSync returned entries and when followSymbolicLinks is true we should not filter symlinks
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.includes('pkg-link'))).toBe(true);
  });
});
