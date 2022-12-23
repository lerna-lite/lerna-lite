import log from 'npmlog';
import { exec, ExecOpts } from '@lerna-lite/core';

import { GitTagOption } from '../types';

/**
 * @param {string} tag
 * @param {{ forceGitTag: boolean; signGitTag: boolean; }} gitOpts
 * @param {import('@lerna/child-process').ExecOpts} opts
 */
export function gitTag(
  tag: string,
  { forceGitTag, signGitTag }: GitTagOption,
  opts: ExecOpts,
  command = 'git tag %s -m %s',
  dryRun = false
) {
  log.silly('gitTag', tag, command);

  const [cmd, ...args] = command.split(' ');
  const interpolatedArgs = args.map((arg) => arg.replace(/%s/, tag));

  if (forceGitTag) {
    interpolatedArgs.push('--force');
  }

  if (signGitTag) {
    interpolatedArgs.push('--sign');
  }

  log.verbose(cmd, interpolatedArgs.toString());
  return exec(cmd, interpolatedArgs, opts, dryRun);
}
