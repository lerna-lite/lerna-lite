import log from 'npmlog';
import { exec, ExecOpts } from '@lerna-lite/core';

import { GitTagOption } from '../types';

/**
 * @param {string} tag
 * @param {{ forceGitTag: boolean; signGitTag: boolean; }} gitOpts
 * @param {import('@lerna/child-process').ExecOpts} opts
 */
export function gitTag(tag: string, { forceGitTag, signGitTag }: GitTagOption, opts: ExecOpts, gitDryRun = false) {
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
