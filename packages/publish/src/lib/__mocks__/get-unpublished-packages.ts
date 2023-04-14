import { vi } from 'vitest';

export const getUnpublishedPackages = vi.fn(() => Promise.resolve([]));
