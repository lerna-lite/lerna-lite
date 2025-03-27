import type { ExecOpts } from '@lerna-lite/core';
import { execSync } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

/**
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 */
export function getLastCommit(execOpts: ExecOpts) {
  if (hasTags(execOpts)) {
    log.silly('git', 'getLastTagInBranch');

    return execSync('git', ['describe', '--tags', '--abbrev=0'], execOpts);
  }

  log.silly('git', 'getFirstCommit');
  return execSync('git', ['rev-list', '--max-parents=0', 'HEAD'], execOpts);
}

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function hasTags(opts: ExecOpts) {
  let result: boolean | string = false;

  try {
    result = !!execSync('git', ['tag'], opts);
  } catch (err: any) {
    log.warn('ENOTAGS', 'No git tags were reachable from this branch!');
    log.verbose('hasTags error', err);
  }

  log.verbose('hasTags', `${result}`);

  return result;
}
