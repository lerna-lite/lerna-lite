import log from 'npmlog';

import { exec } from '@lerna-lite/core';

/**
 * @param {string} tag
 * @param {{ forceGitTag: boolean; signGitTag: boolean; }} gitOpts
 * @param {import('@lerna/child-process').ExecOpts} opts
 */
export function gitTag(tag, { forceGitTag, signGitTag }, opts, gitDryRun = false) {
  log.silly('gitTag', tag);

  const args = ['tag', tag, '-m', tag];

  if (forceGitTag) {
    args.push('--force');
  }

  if (signGitTag) {
    args.push('--sign');
  }

  log.verbose('git', args.join(' '));
  return exec('git', args, opts, gitDryRun);
}
