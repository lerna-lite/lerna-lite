import log from 'npmlog';

import { exec } from '@lerna-lite/core';

/**
 * Reset files modified by publish steps.
 * @param {string[]} stagedFiles
 * @param {{ granularPathspec: boolean; }} gitOpts
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 */
export function gitCheckout(stagedFiles, gitOpts, execOpts, gitDryRun = false) {
  const files = gitOpts.granularPathspec ? stagedFiles : '.';

  log.silly('gitCheckout', files);

  return exec('git', ['checkout', '--'].concat(files), execOpts, gitDryRun);
}
