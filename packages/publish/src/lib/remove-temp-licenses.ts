import fs from 'fs-extra';
import pMap from 'p-map';

import { Package } from '@lerna-lite/core';

/**
 * Remove temporary license files.
 * @param {Package[]} packagesToBeLicensed
 */
export function removeTempLicenses(packagesToBeLicensed: Package[]): Promise<any> {
  if (!packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  return pMap(packagesToBeLicensed, (pkg) => fs.remove(pkg.licensePath));
}
