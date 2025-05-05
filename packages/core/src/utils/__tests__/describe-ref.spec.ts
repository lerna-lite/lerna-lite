import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('../../child-process');

import * as childProcess from '../../child-process.js';
import { DescribeRefDetailedResult } from '../../models/index.js';
import { describeRef, describeRefSync } from '../describe-ref.js';

const DEFAULT_ARGS = ['describe', '--always', '--long', '--dirty', '--first-parent'];

describe('describeRef()', () => {
  beforeEach(() => {
    (childProcess.exec as Mock).mockResolvedValueOnce({ stdout: 'v1.2.3-4-g567890a' });
  });

  it('resolves parsed metadata', async () => {
    const result = await describeRef();

    expect(childProcess.exec).toHaveBeenLastCalledWith('git', DEFAULT_ARGS, {}, false);
    expect(result).toEqual({
      isDirty: false,
      lastTagName: 'v1.2.3',
      lastVersion: 'v1.2.3',
      refCount: '4',
      sha: '567890a',
    });
  });

  it('accepts options.cwd', async () => {
    const options = { cwd: 'foo' };
    await describeRef(options);

    expect(childProcess.exec).toHaveBeenLastCalledWith('git', DEFAULT_ARGS, options, false);
  });

  it('accepts options.cwd in Git dry-run mode', async () => {
    const options = { cwd: 'foo' };
    await describeRef(options, false, true);

    expect(childProcess.exec).toHaveBeenLastCalledWith('git', DEFAULT_ARGS, options, true);
  });

  it('accepts options.match', async () => {
    const options = { match: 'v*.*.*' };
    await describeRef(options);

    expect(childProcess.exec).toHaveBeenLastCalledWith('git', DEFAULT_ARGS.concat(['--match', 'v*.*.*']), options, false);
  });

  it('accepts options.match in Git dry-run mode', async () => {
    const options = { match: 'v*.*.*' };
    await describeRef(options, false, true);

    expect(childProcess.exec).toHaveBeenLastCalledWith('git', DEFAULT_ARGS.concat(['--match', 'v*.*.*']), options, true);
  });

  it('accepts includeMergedTags argument', async () => {
    const includeMergedTags = true;

    await describeRef({}, includeMergedTags);

    const newArgs = [...DEFAULT_ARGS];
    newArgs.pop();
    expect(childProcess.exec).toHaveBeenLastCalledWith('git', newArgs, {}, false);
  });
});

describe('describeRefSync()', () => {
  beforeEach(() => {
    (childProcess.execSync as Mock).mockReturnValueOnce('v1.2.3-4-g567890a');
  });

  it('returns parsed metadata', () => {
    const result = describeRefSync();

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', DEFAULT_ARGS, {}, false);
    expect(result).toEqual({
      isDirty: false,
      lastTagName: 'v1.2.3',
      lastVersion: 'v1.2.3',
      refCount: '4',
      sha: '567890a',
    });
  });

  it('accepts options.cwd', () => {
    const options = { cwd: 'foo' };
    describeRefSync(options);

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', DEFAULT_ARGS, options, false);
  });

  it('accepts options.cwd in Git dry-run mode', () => {
    const options = { cwd: 'foo' };
    describeRefSync(options, false, true);

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', DEFAULT_ARGS, options, true);
  });

  it('accepts options.match', () => {
    const options = { match: 'v*.*.*' };
    describeRefSync(options);

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', DEFAULT_ARGS.concat(['--match', 'v*.*.*']), options, false);
  });

  it('accepts options.match in Git dry-run mode', () => {
    const options = { match: 'v*.*.*' };
    describeRefSync(options, false, true);

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', DEFAULT_ARGS.concat(['--match', 'v*.*.*']), options, true);
  });

  it('accepts includeMergedTags argument', async () => {
    const includeMergedTags = true;

    describeRefSync({}, includeMergedTags);

    const newArgs = [...DEFAULT_ARGS];
    newArgs.pop();
    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', newArgs, {}, false);
  });
});

describe('parser', () => {
  it('matches independent tags', () => {
    (childProcess.execSync as Mock).mockReturnValueOnce('pkg-name@1.2.3-4-g567890a');

    const result = describeRefSync();

    expect(result.lastTagName).toBe('pkg-name@1.2.3');
    expect(result.lastVersion).toBe('1.2.3');
  });

  it('matches independent tags for scoped packages', () => {
    (childProcess.execSync as Mock).mockReturnValueOnce('@scope/pkg-name@1.2.3-4-g567890a');

    const result = describeRefSync();

    expect(result.lastTagName).toBe('@scope/pkg-name@1.2.3');
    expect(result.lastVersion).toBe('1.2.3');
  });

  it('matches dirty annotations', () => {
    (childProcess.execSync as Mock).mockReturnValueOnce('pkg-name@1.2.3-4-g567890a-dirty');

    const result = describeRefSync();

    expect(result.isDirty).toBe(true);
  });

  describe('custom tag-version-separator', () => {
    it('matches independent tags using a custom tag-version-separator, CASE 1', () => {
      (childProcess.execSync as Mock).mockReturnValueOnce('pkg-name__1.2.3-4-g567890a');

      const result = describeRefSync({ separator: '__' }) as DescribeRefDetailedResult;

      expect(result.lastTagName).toBe('pkg-name__1.2.3');
      expect(result.lastVersion).toBe('1.2.3');
    });

    it('matches independent tags using a custom tag-version-separator, CASE 2', () => {
      (childProcess.execSync as Mock).mockReturnValueOnce('pkg-name-1.2.3-4-g567890a');

      const result = describeRefSync({ separator: '-' }) as DescribeRefDetailedResult;

      expect(result.lastTagName).toBe('pkg-name-1.2.3');
      expect(result.lastVersion).toBe('1.2.3');
    });

    it('matches independent tags for scoped packages', () => {
      (childProcess.execSync as Mock).mockReturnValueOnce('@scope/pkg-name_1.2.3-4-g567890a');

      const result = describeRefSync({ separator: '_' }) as DescribeRefDetailedResult;

      expect(result.lastTagName).toBe('@scope/pkg-name_1.2.3');
      expect(result.lastVersion).toBe('1.2.3');
    });

    it('matches dirty annotations', () => {
      (childProcess.execSync as Mock).mockReturnValueOnce('pkg-name@@1.2.3-4-g567890a-dirty');

      const result = describeRefSync({ separator: '@@' });

      expect(result.isDirty).toBe(true);
    });
  });

  it('handles non-matching strings safely', () => {
    (childProcess.execSync as Mock).mockReturnValueOnce('poopy-pants');

    const result = describeRefSync();

    expect(result).toEqual({
      isDirty: false,
      lastTagName: undefined,
      lastVersion: undefined,
      refCount: undefined,
      sha: undefined,
    });
  });

  it('detects fallback and returns partial metadata', () => {
    (childProcess.execSync as Mock).mockReturnValueOnce('a1b2c3d');
    (childProcess.execSync as Mock).mockReturnValueOnce('123');

    const options = { cwd: 'bar' };
    const result = describeRefSync(options);

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', ['rev-list', '--count', 'a1b2c3d'], options);
    expect(result).toEqual({
      isDirty: false,
      refCount: '123',
      sha: 'a1b2c3d',
    });
  });

  it('detects dirty fallback and returns partial metadata', () => {
    (childProcess.execSync as Mock).mockReturnValueOnce('a1b2c3d-dirty');
    (childProcess.execSync as Mock).mockReturnValueOnce('456');

    const result = describeRefSync();

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', ['rev-list', '--count', 'a1b2c3d'], {});
    expect(result).toEqual({
      isDirty: true,
      refCount: '456',
      sha: 'a1b2c3d',
    });
  });

  it('should return metadata for tag names that are sha-like', () => {
    (childProcess.execSync as Mock).mockReturnValueOnce('20190104-5-g6fb4e3293');

    const result = describeRefSync();

    expect(result).toEqual({
      isDirty: false,
      lastTagName: '20190104',
      lastVersion: '20190104',
      refCount: '5',
      sha: '6fb4e3293',
    });
  });
});
