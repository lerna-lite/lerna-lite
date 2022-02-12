import log from 'npmlog';

import { execSync } from '@lerna-lite/core';

export function isAnythingCommitted(opts, gitDryRun = false) {
  log.silly('isAnythingCommitted', '');
  let anyCommits = execSync('git', ['rev-list', '--count', '--all', '--max-count=1'], opts, gitDryRun);
  if (gitDryRun) {
    anyCommits = '1';
  }
  log.verbose('isAnythingCommitted', anyCommits);

  return Boolean(parseInt(anyCommits, 10));
}
