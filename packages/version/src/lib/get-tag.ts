import { type ExecOpts, execSync } from '@lerna-lite/core';

export interface PreviousTag {
  name: string | null;
  date: string | null;
  sha: string | null;
}

/**
 * Find the previous Tag details
 * @param {ExecOpts} [execOpts]
 * @param {Boolean} [isIndependent]
 * @returns {Object} - tag details with potentially null values
 */
export function getPreviousTag(execOpts?: ExecOpts, isIndependent?: boolean) {
  try {
    // Get tag name
    const tagNameArgs = ['describe', '--tags', '--abbrev=0'];
    if (isIndependent) {
      tagNameArgs.push('--match=*@*');
    }
    const name = execSync('git', tagNameArgs, execOpts);

    // Get the tag SHA
    const tagShaArgs = ['rev-list', '-n', '1', name];
    const sha = execSync('git', tagShaArgs, execOpts);

    // Get the date of the last tag
    const tagDateArgs = ['log', '-1', '--format=%cd', '--date=iso-strict'];
    if (name) {
      tagDateArgs.push(name);
    }
    const date = execSync('git', tagDateArgs, execOpts);

    return { name, date, sha };
  } catch (error) {
    // When no tags exist, return null for all values
    return { name: null, date: null, sha: null };
  }
}
