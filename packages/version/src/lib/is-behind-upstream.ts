import log from 'npmlog';

import { execSync } from '@lerna-lite/core';

export function isBehindUpstream(gitRemote, branch, opts, gitDryRun = false) {
  log.silly('isBehindUpstream', '');

  updateRemote(opts, gitDryRun);

  const remoteBranch = `${gitRemote}/${branch}`;
  const [behind, ahead] = countLeftRight(`${remoteBranch}...${branch}`, opts, gitDryRun);

  log.silly(
    'isBehindUpstream',
    `${branch} is behind ${remoteBranch} by ${behind} commit(s) and ahead by ${ahead}`
  );

  return Boolean(behind);
}

export function updateRemote(opts, gitDryRun = false) {
  // git fetch, but for everything
  execSync('git', ['remote', 'update'], opts, gitDryRun);
}

export function countLeftRight(symmetricDifference, opts, gitDryRun = false) {
  const stdout = execSync(
    'git',
    ['rev-list', '--left-right', '--count', symmetricDifference],
    opts,
    gitDryRun
  );

  return stdout.split('\t').map(val => parseInt(val, 10));
}
