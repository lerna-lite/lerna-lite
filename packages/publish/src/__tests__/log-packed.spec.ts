import type { Package } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import c from 'tinyrainbow';
import { describe, expect, it, vi } from 'vitest';

import type { Tarball } from '../interfaces.js';
import { logPacked } from '../lib/log-packed.js';

describe('log-packed', () => {
  const pkg = {
    name: '@lerna-lite/core',
    version: '1.3.0',
    dependencies: {
      'tiny-tarball': '^1.0.0',
    },
    devDependencies: {
      eslint: '^8.16.0',
    },
    location: '',
    manifestLocation: '',
    packed: {
      id: '@lerna-lite/core@1.4.1',
      name: '@lerna-lite/core',
      filename: 'lerna-lite.tar.tgz',
      files: [{ 'package-1': 'location1' }],
      version: '1.4.1',
      size: 84219,
      shasum: 'ABC123',
      integrity: 'ABC123',
      unpackedSize: 340009,
      entryCount: 14,
      bundled: [
        {
          name: 'test',
        },
      ],
    },
  } as unknown as Package & { packed: Tarball };

  it('should display dry-run details', () => {
    const logSpy = vi.spyOn(log, 'notice');

    logPacked(pkg, true);

    expect(logSpy).toHaveBeenCalledWith('=== Bundled Dependencies ===', '');
    expect(logSpy).toHaveBeenCalledWith('=== Tarball Details ===', '');
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('size: '));
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('package size: '));
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('unpacked size: '));
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('shasum: '));
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('integrity: '));
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('bundled deps: '));
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('bundled files: '));
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('own files: '));
    expect(logSpy).toHaveBeenCalledWith('', expect.stringContaining('total files: '));
    expect(logSpy).toHaveBeenCalledWith('', `--- ${c.bgMagenta('DRY-RUN')} details ---`);
    expect(logSpy).toHaveBeenCalledWith('', 'package name: @lerna-lite/core');
    expect(logSpy).toHaveBeenCalledWith('dependencies:', '');
    expect(logSpy).toHaveBeenCalledWith('', 'tiny-tarball | ^1.0.0');
    expect(logSpy).toHaveBeenCalledWith('devDependencies:', '');
    expect(logSpy).toHaveBeenCalledWith('', 'eslint | ^8.16.0');
    expect(logSpy).toHaveBeenCalledWith('', '');
  });
});
