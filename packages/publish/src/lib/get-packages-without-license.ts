import { dirname } from 'node:path';

import type { Package, Project } from '@lerna-lite/core';

/**
 * Retrieve a list of packages that lack a license file.
 * @param {Project} project
 * @param {Package[]} packagesToPublish
 * @returns {Package[]}
 */
export function getPackagesWithoutLicense(project: Project, packagesToPublish: Package[]) {
  return project.getPackageLicensePaths().then((licensePaths: string[]) => {
    // this assumes any existing license is a sibling of package.json, which is pretty safe
    // it also dedupes package locations, since we don't care about duplicate license files
    const licensed = new Set(licensePaths.map((lp: string) => dirname(lp)));

    return packagesToPublish.filter((pkg) => !licensed.has(pkg.location));
  });
}
