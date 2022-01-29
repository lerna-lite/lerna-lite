import fs from 'fs-extra';
import path from 'path';

import { BLANK_LINE, COMMIT_GUIDELINE } from './constants';

/**
 * Read the existing changelog, if it exists.
 * @param {import("@lerna/package").Package} pkg
 * @returns {Promise<[string, string]>} A tuple of changelog location and contents
 */
export async function readExistingChangelog(pkg) {
  const changelogFileLoc = path.join(pkg.location, 'CHANGELOG.md');

  // catch allows missing file to pass without breaking chain
  let changelogContents = await fs.readFile(changelogFileLoc, 'utf8');

  // Remove the header if it exists, thus starting at the first entry.
  const headerIndex = changelogContents.indexOf(COMMIT_GUIDELINE);

  if (headerIndex !== -1) {
    changelogContents = changelogContents.substring(headerIndex + COMMIT_GUIDELINE.length + BLANK_LINE.length);
  }

  return [changelogFileLoc, changelogContents];
}
