import { describe, expect, it, vi, type Mock } from 'vitest';

import * as childProcess from '../../../child-process.js';
import { hasTags } from '../lib/has-tags.js';

vi.mock('../../../child-process');

describe('hasTags()', () => {
  (childProcess.execSync as Mock).mockImplementation(() => 'v1.0.0\nv1.0.1');

  it('calls `git tag` with options passed in', () => {
    hasTags({ cwd: 'test' });

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', ['tag'], { cwd: 'test' });
  });

  it('calls `git tag` with --list pattern', () => {
    hasTags({ cwd: 'test' }, '*@*');

    expect(childProcess.execSync).toHaveBeenLastCalledWith('git', ['tag', '--list', '*@*'], { cwd: 'test' });
  });

  it('returns true when tags exist', () => {
    expect(hasTags()).toBe(true);
  });

  it('returns false when tags do not exist', () => {
    (childProcess.execSync as Mock).mockImplementation(() => '');

    expect(hasTags()).toBe(false);
  });

  it('returns false when git command errors', () => {
    (childProcess.execSync as Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    expect(hasTags()).toBe(false);
  });
});
