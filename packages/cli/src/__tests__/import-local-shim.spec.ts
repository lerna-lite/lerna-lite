import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs');
vi.mock('node:module');
vi.mock('node:url');

import * as fs from 'node:fs';
import * as module_ from 'node:module';
import * as url from 'node:url';

import { importLocal } from '../import-local-shim.js';

describe('importLocal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined if localPath does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = importLocal('somefile.js');
    expect(result).toBeUndefined();
    expect(fs.existsSync).toHaveBeenCalled();
  });

  it('calls require if localPath exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const fakeRequire = vi.fn().mockReturnValue('local-cli');
    vi.mocked(module_.createRequire).mockReturnValue(fakeRequire as any);
    const result = importLocal('somefile.js');
    expect(module_.createRequire).toHaveBeenCalled();
    expect(fakeRequire).toHaveBeenCalled();
    expect(result).toBe('local-cli');
  });

  it('handles file URLs', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(url.fileURLToPath).mockReturnValue('converted.js');
    importLocal('file://somefile.js');
    expect(url.fileURLToPath).toHaveBeenCalledWith('file://somefile.js');
  });
});
