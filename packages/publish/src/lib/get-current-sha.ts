import type { ExecOpts } from '@lerna-lite/core';

import { execSync } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

/**
 * Retrieve current SHA from git.
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
export function getCurrentSHA(opts: ExecOpts, dryRun = false) {
  log.silly('getCurrentSHA', '');

  const sha = execSync('git', ['rev-parse', 'HEAD'], opts, dryRun);
  log.verbose('getCurrentSHA', sha);

  return sha;
}
