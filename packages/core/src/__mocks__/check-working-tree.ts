import { vi } from 'vitest';

export const checkWorkingTree = vi.fn(() => Promise.resolve());
export const throwIfReleased = vi.fn(() => Promise.resolve());
export const throwIfUncommitted = vi.fn(() => vi.fn(() => Promise.resolve()));
