import { vi } from 'vitest';

export const getCommitsSinceLastRelease = vi.fn(() => Promise.resolve());
export const getLastTagDetails = vi.fn(() => ({ tagHash: undefined, tagDate: undefined, tagRefCount: 0 }));
