import log from 'npmlog';

import { execSync } from '../../../child-process';

/**
 * Determine if any git tags are reachable.
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
export function hasTags(opts) {
  log.silly('hasTags', '');
  let result = false;

  try {
    result = !!execSync('git', ['tag'], opts);
  } catch (err: any) {
    log.warn('ENOTAGS', 'No git tags were reachable from this branch!');
    log.verbose('hasTags error', err);
  }

  log.verbose('hasTags', result.toString());

  return result;
}
