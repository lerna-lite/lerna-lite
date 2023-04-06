import { vi } from 'vitest';

// to mock user modules, you _must_ call `vi.mock('./path/to/module')`
export const getTwoFactorAuthRequired = vi.fn(() => Promise.resolve(false));
