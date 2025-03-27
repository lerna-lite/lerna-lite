import type { ExecOpts } from '@lerna-lite/core';
import { execSync } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
export function hasCommit(opts: ExecOpts) {
  log.silly('git', 'hasCommit');
  let retVal;

  try {
    execSync('git', ['log'], opts);
    retVal = true;
  } catch (e) {
    retVal = false;
  }

  log.verbose('hasCommit', retVal);
  return retVal;
}
