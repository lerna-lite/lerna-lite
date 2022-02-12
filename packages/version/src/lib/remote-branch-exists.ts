import log from 'npmlog';

import { execSync } from '@lerna-lite/core';

/**
 * @param {string} gitRemote
 * @param {string} branch
 * @param {import('@lerna/child-process').ExecOpts} opts
 */
export function remoteBranchExists(gitRemote: string, branch: string, opts, gitDryRun = false) {
  log.silly('remoteBranchExists', '');

  const remoteBranch = `${gitRemote}/${branch}`;

  try {
    execSync('git', ['show-ref', '--verify', `refs/remotes/${remoteBranch}`], opts, gitDryRun);
    return true;
  } catch (e) {
    return false;
  }
}
