import { EOL } from 'node:os';
import type { ExecOpts } from '@lerna-lite/core';
import { exec } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import type { GitCommitOption } from '../interfaces.js';
import { tempWrite } from '../utils/temp-write.js';

/**
 * @param {string} message
 * @param {{ amend: boolean; commitHooks: boolean; signGitCommit: boolean; }} gitOpts
 * @param {import('@lerna/child-process').ExecOpts} opts
 */
export function gitCommit(
  message: string,
  { amend, commitHooks, overrideMessage, signGitCommit, signoffGitCommit }: GitCommitOption,
  opts: ExecOpts,
  dryRun = false
) {
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

  const shouldChangeMessage = amend ? amend && overrideMessage : true;
  if (amend) {
    args.push('--amend');
  }

  if (shouldChangeMessage) {
    if (message.indexOf(EOL) > -1) {
      // Use tempfile to allow multi\nline strings.
      args.push('-F', tempWrite.sync(message, 'lerna-commit.txt'));
    } else {
      args.push('-m', message);
    }
  } else {
    args.push('--no-edit');
  }

  log.verbose('git', args.join(' '));
  return exec('git', args, opts, dryRun);
}
