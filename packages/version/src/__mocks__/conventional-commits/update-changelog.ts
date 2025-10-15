import { join } from 'node:path';
import { vi } from 'vitest';

const { outputFile } = await vi.importActual<any>('fs-extra/esm');

const mockUpdateChangelog = vi.fn().mockName('updateChangelog');

mockUpdateChangelog.mockImplementation((pkg) => {
  const filePath = join(pkg.location, 'CHANGELOG.md');

  // grumble grumble re-implementing the implementation
  return outputFile(filePath, 'changelog', 'utf8').then(() => ({
    logPath: filePath,
    newEntry: pkg.version ? `${pkg.name} - ${pkg.version}` : pkg.name,
  }));
});

export const updateChangelog = mockUpdateChangelog;
