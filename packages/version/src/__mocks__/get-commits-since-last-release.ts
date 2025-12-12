import { vi } from 'vitest';

export const getCommitsSinceLastRelease = vi.fn(() => Promise.resolve());
export const getOldestCommitSinceLastTag = vi.fn();
export const getLastTagDetails = vi.fn(() => ({ tagHash: undefined, tagDate: undefined, tagRefCount: 0 }));
