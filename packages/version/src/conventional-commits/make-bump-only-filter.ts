import type { Package } from '@lerna-lite/core';

import { BLANK_LINE } from './constants.js';

/**
 * @param {import("@lerna/package").Package} pkg
 * @return {(entry: string) => string}
 */
export function makeBumpOnlyFilter(pkg: Package, newEntry: string) {
  // When force publishing, it is possible that there will be no actual changes, only a version bump.
  if (!newEntry.split('\n').some((line) => line.startsWith('*'))) {
    // keep ref of a "bump only" in the package itself
    pkg.isBumpOnlyVersion = true;

    // Add a note to indicate that only a version bump has occurred.
    // TODO: actually list the dependencies that were bumped
    const message = `**Note:** Version bump only for package ${pkg.name}`;

    // the extra blank lines preserve the whitespace delimiting releases
    return [newEntry.trim(), message, BLANK_LINE].join(BLANK_LINE);
  }

  return newEntry;
}
