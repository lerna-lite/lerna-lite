import { basename, join } from 'node:path';

import { copy, type Package } from '@lerna-lite/core';
import pMap from 'p-map';

/**
 * Create temporary license files.
 * @param {string} srcLicensePath
 * @param {Packages[]} packagesToBeLicensed
 */
export function createTempLicenses(srcLicensePath: string, packagesToBeLicensed: Package[]): Promise<any> {
  if (!srcLicensePath || !packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  // license file might have an extension, so let's allow it
  const licenseFileName = basename(srcLicensePath);
  // (preserveTimestamps option removed; not supported by native copy)

  // store target path for removal later
  packagesToBeLicensed.forEach((pkg) => {
    pkg.licensePath = join(pkg.contents, licenseFileName);
  });

  return pMap(packagesToBeLicensed, (pkg) => copy(srcLicensePath, pkg.licensePath));
}
