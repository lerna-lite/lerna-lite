import { describe, expect, it } from 'vitest';

import { slash } from '../slash.js';

describe('slash', () => {
  it('should convert backslashes to forward slashes', () => {
    expect(slash('foo\\bar')).toBe('foo/bar');
    expect(slash('foo\\bar\\baz')).toBe('foo/bar/baz');
  });

  it('should leave forward slashes unchanged', () => {
    expect(slash('foo/bar')).toBe('foo/bar');
    expect(slash('foo/bar/baz')).toBe('foo/bar/baz');
  });

  it('should handle mixed slashes', () => {
    expect(slash('foo\\bar/baz')).toBe('foo/bar/baz');
  });

  it('should handle empty string', () => {
    expect(slash('')).toBe('');
  });

  it('should not modify extended-length paths', () => {
    expect(slash('\\\\?\\some\\path')).toBe('\\\\?\\some\\path');
  });

  it('should handle paths with no slashes', () => {
    expect(slash('foo')).toBe('foo');
  });
});
