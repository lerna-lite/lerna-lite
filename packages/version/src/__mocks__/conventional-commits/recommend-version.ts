import semver from 'semver';
import { vi } from 'vitest';

const mockRecommendVersion = vi.fn().mockName('recommendVersion');

mockRecommendVersion.mockImplementation((node) => semver.inc(node.version, 'patch'));

export const recommendVersion = mockRecommendVersion;
