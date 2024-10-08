import { vi } from 'vitest';
import semver from 'semver';

const mockRecommendVersion = vi.fn().mockName('recommendVersion');

mockRecommendVersion.mockImplementation((node) => semver.inc(node.version, 'patch'));

export const recommendVersion = mockRecommendVersion;
