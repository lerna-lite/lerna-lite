import { vi } from 'vitest';

const mockApplyBuildMetadata = vi.fn().mockName('applyBuildMetadata');

mockApplyBuildMetadata.mockImplementation((version, buildMetadata) => {
  if (buildMetadata) {
    return `${version}+${buildMetadata}`;
  }
  return version;
});

export const applyBuildMetadata = mockApplyBuildMetadata;
