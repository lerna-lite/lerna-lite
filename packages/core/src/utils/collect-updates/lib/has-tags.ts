import log from 'npmlog';

import { execSync } from '../../../child-process';

/**
 * Determine if any git tags are reachable.
 * @param {import("@lerna/child-process").ExecOpts} opts
 * @param {string} tagPattern
 */
export function hasTags(opts, tagPattern: string) {
  log.silly('hasTags', '');
  let result = false;
  const args = ['tag'];

  if (tagPattern) {
    log.verbose('hasTags', `filter for tags with '${tagPattern}' pattern`);
    args.push('--list', tagPattern);
  }

  try {
    result = !!execSync('git', args, opts);
  } catch (err: any) {
    log.warn('ENOTAGS', 'No git tags were reachable from this branch!');
    log.verbose('hasTags error', err);
  }

  log.verbose('hasTags', result.toString());

  return result;
}
