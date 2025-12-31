import type { ExecOpts } from '@lerna-lite/core';
import { execSync } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

export function getCurrentBranch(opts: ExecOpts, dryRun = false) {
  log.silly('currentBranch', '');
  const branch = execSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], opts, dryRun);
  log.verbose('currentBranch', branch);

  return dryRun ? 'main' : branch;
}
