import { readFile } from 'fs/promises';
import { join } from 'node:path';

import type { Package } from '@lerna-lite/core';

import { BLANK_LINE, COMMIT_GUIDELINE } from './constants.js';

/**
 * Read the existing changelog, if it exists.
 * @param {import("@lerna/package").Package} pkg
 * @returns {Promise<[string, string]>} A tuple of changelog location and contents
 */
export async function readExistingChangelog(pkg: Package) {
  const changelogFileLoc = join(pkg.location, 'CHANGELOG.md');

  // catch allows missing file to pass without breaking chain
  let changelogContents = await readFile(changelogFileLoc, 'utf8').catch(() => '');

  // Remove the header if it exists, thus starting at the first entry.
  const headerIndex = changelogContents.indexOf(COMMIT_GUIDELINE);

  if (headerIndex !== -1) {
    changelogContents = changelogContents.substring(headerIndex + COMMIT_GUIDELINE.length + BLANK_LINE.length);
  }

  // consumer expects resolved tuple
  return [changelogFileLoc, changelogContents];
}
