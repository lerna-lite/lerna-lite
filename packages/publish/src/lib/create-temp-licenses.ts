import fs from 'fs-extra';
import path from 'path';
import pMap from 'p-map';

import { Package } from '@lerna-lite/core';

/**
 * Create temporary license files.
 * @param {string} srcLicensePath
 * @param {Packages[]} packagesToBeLicensed
 */
export function createTempLicenses(srcLicensePath, packagesToBeLicensed: Package[]): Promise<any> {
  if (!srcLicensePath || !packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  // license file might have an extension, so let's allow it
  const licenseFileName = path.basename(srcLicensePath);
  const options = {
    // make an effort to keep package contents stable over time
    preserveTimestamps: process.arch !== 'ia32',
    // (give up on 32-bit architecture to avoid fs-extra warning)
  };

  // store target path for removal later
  packagesToBeLicensed.forEach((pkg) => {
    pkg.licensePath = path.join(pkg.contents, licenseFileName);
  });

  return pMap(packagesToBeLicensed, (pkg) => fs.copy(srcLicensePath, pkg.licensePath, options));
}
