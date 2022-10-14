import log from 'npmlog';
import { ExecOpts, execSync } from '@lerna-lite/core';

export function isBehindUpstream(gitRemote: string, branch: string, opts: ExecOpts, dryRun = false) {
  log.silly('isBehindUpstream', '');

  updateRemote(opts, dryRun);

  const remoteBranch = `${gitRemote}/${branch}`;
  const [behind, ahead] = countLeftRight(`${remoteBranch}...${branch}`, opts, dryRun);

  log.silly('isBehindUpstream', `${branch} is behind ${remoteBranch} by ${behind} commit(s) and ahead by ${ahead}`);

  return Boolean(behind);
}

export function updateRemote(opts, dryRun = false) {
  // git fetch, but for everything
  execSync('git', ['remote', 'update'], opts, dryRun);
}

export function countLeftRight(symmetricDifference: string, opts: ExecOpts, dryRun = false) {
  const stdout = execSync('git', ['rev-list', '--left-right', '--count', symmetricDifference], opts, dryRun);

  return stdout.split('\t').map((val) => parseInt(val, 10));
}
