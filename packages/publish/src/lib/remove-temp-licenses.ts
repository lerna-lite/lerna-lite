import { remove, type Package } from '@lerna-lite/core';
import pMap from 'p-map';

/**
 * Remove temporary license files.
 * @param {Package[]} packagesToBeLicensed
 */
export function removeTempLicenses(packagesToBeLicensed: Package[]): Promise<void | void[]> {
  if (!packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  return pMap(packagesToBeLicensed, (pkg) => remove(pkg.licensePath));
}
