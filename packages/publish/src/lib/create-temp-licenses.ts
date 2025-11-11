import { copy } from 'fs-extra/esm';
import { basename, join } from 'node:path';
import pMap from 'p-map';

import type { Package } from '@lerna-lite/core';

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
  const options = {
    // make an effort to keep package contents stable over time
    preserveTimestamps: process.arch !== 'ia32',
    // (give up on 32-bit architecture to avoid fs-extra warning)
  };

  // store target path for removal later
  packagesToBeLicensed.forEach((pkg) => {
    pkg.licensePath = join(pkg.contents, licenseFileName);
  });

  return pMap(packagesToBeLicensed, (pkg) => copy(srcLicensePath, pkg.licensePath, options));
}
