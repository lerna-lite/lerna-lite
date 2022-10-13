import log from 'npmlog';

import { ExecOpts, execSync } from '@lerna-lite/core';

export function getCurrentBranch(opts: ExecOpts, dryRun = false) {
  log.silly('currentBranch', '');
  const branch = execSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], opts, dryRun);
  log.verbose('currentBranch', branch);

  return dryRun ? 'main' : branch;
}
