import { execSync } from '@lerna-lite/core';
import { describe, it, expect, vi } from 'vitest';

import { getPreviousTag } from '../lib/get-tag.js';

// Mock execSync to simulate different Git scenarios
vi.mock('@lerna-lite/core', () => ({
  execSync: vi.fn(),
}));

describe('getPreviousTag()', () => {
  it('should return tag name, SHA, and date for fixed versioning', () => {
    // Simulate successful tag retrieval
    vi.mocked(execSync)
      .mockReturnValueOnce('v1.2.3') // tag name
      .mockReturnValueOnce('abc123sha') // tag SHA
      .mockReturnValueOnce('2023-12-12T10:30:00+00:00'); // tag date

    const result = getPreviousTag();

    expect(result).toEqual({
      name: 'v1.2.3',
      sha: 'abc123sha',
      date: '2023-12-12T10:30:00+00:00',
    });
  });

  it('should handle independent versioning mode', () => {
    // Simulate independent mode tag retrieval
    vi.mocked(execSync)
      .mockReturnValueOnce('package@1.2.3') // tag name
      .mockReturnValueOnce('def456sha') // tag SHA
      .mockReturnValueOnce('2023-12-12T10:30:00+00:00'); // tag date

    const result = getPreviousTag(undefined, true);

    expect(result).toEqual({
      name: 'package@1.2.3',
      sha: 'def456sha',
      date: '2023-12-12T10:30:00+00:00',
    });
  });

  it('should handle no tags scenario', () => {
    // Simulate no tags exist
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('No tags found');
    });

    const result = getPreviousTag();

    expect(result).toEqual({
      name: null,
      sha: null,
      date: null,
    });
  });

  it('should pass custom execOpts', () => {
    const mockExecOpts = { cwd: '/custom/path' };

    // Simulate tag retrieval with custom options
    vi.mocked(execSync)
      .mockReturnValueOnce('v1.2.3')
      .mockReturnValueOnce('abc123sha')
      .mockReturnValueOnce('2023-12-12T10:30:00+00:00');

    getPreviousTag(mockExecOpts);

    // Verify execSync was called with custom options for each command
    expect(vi.mocked(execSync)).toHaveBeenCalledWith('git', expect.any(Array), mockExecOpts);
  });
});
