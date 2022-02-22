import { EOL } from 'os';
import log from 'npmlog';
import tempWrite from 'temp-write';

import { exec, ExecOpts } from '@lerna-lite/core';

/**
 * @param {string} message
 * @param {{ amend: boolean; commitHooks: boolean; signGitCommit: boolean; }} gitOpts
 * @param {import('@lerna/child-process').ExecOpts} opts
 */
export function gitCommit(message: string, { amend, commitHooks, signGitCommit, signoffGitCommit }: any, opts: ExecOpts, gitDryRun = false) {
  log.silly('gitCommit', message);
  const args = ['commit'];

  if (commitHooks === false) {
    args.push('--no-verify');
  }

  if (signGitCommit) {
    args.push('--gpg-sign');
  }

  if (signoffGitCommit) {
    args.push('--signoff');
  }

  if (amend) {
    args.push('--amend', '--no-edit');
  } else if (message.indexOf(EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    args.push('-F', tempWrite.sync(message, 'lerna-commit.txt'));
  } else {
    args.push('-m', message);
  }

  log.verbose('git', args.join(' '));
  return exec('git', args, opts, gitDryRun);
}
