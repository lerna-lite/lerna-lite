import { increment } from 'verkit';
import { vi } from 'vitest';

const mockRecommendVersion = vi.fn().mockName('recommendVersion');

mockRecommendVersion.mockImplementation((node) => increment(node.version, 'patch'));

export const recommendVersion = mockRecommendVersion;
