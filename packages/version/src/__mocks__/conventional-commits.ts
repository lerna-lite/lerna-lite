import path from 'path';
import semver from 'semver';
const { outputFile } = await vi.importActual<any>('fs-extra/esm');

const mockApplyBuildMetadata = vi.fn().mockName('applyBuildMetadata');
const mockRecommendVersion = vi.fn().mockName('recommendVersion');
const mockUpdateChangelog = vi.fn().mockName('updateChangelog');

mockApplyBuildMetadata.mockImplementation((version, buildMetadata) => {
  if (buildMetadata) {
    return `${version}+${buildMetadata}`;
  }
  return version;
});

mockRecommendVersion.mockImplementation((node) => semver.inc(node.version, 'patch'));

mockUpdateChangelog.mockImplementation((pkg) => {
  const filePath = path.join(pkg.location, 'CHANGELOG.md');

  // grumble grumble re-implementing the implementation
  return outputFile(filePath, 'changelog', 'utf8').then(() => ({
    logPath: filePath,
    newEntry: pkg.version ? `${pkg.name} - ${pkg.version}` : pkg.name,
  }));
});

export const applyBuildMetadata = mockApplyBuildMetadata;
export const recommendVersion = mockRecommendVersion;
export const updateChangelog = mockUpdateChangelog;
