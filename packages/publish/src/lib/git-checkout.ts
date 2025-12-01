import type { ExecOpts } from '@lerna-lite/core';
import { exec } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

/**
 * Reset files modified by publish steps.
 * @param {string[]} stagedFiles
 * @param {{ granularPathspec: boolean; }} gitOpts
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 */
export function gitCheckout(stagedFiles: string[], gitOpts: { granularPathspec: boolean }, execOpts: ExecOpts, dryRun = false) {
  const files = (gitOpts.granularPathspec ? stagedFiles : '.') as string;

  log.silly('gitCheckout', files);

  return exec('git', ['checkout', '--'].concat(files), execOpts, dryRun);
}
