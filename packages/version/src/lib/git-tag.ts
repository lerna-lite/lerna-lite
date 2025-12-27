import type { ExecOpts } from '@lerna-lite/core';
import { exec } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

import type { GitTagOption } from '../interfaces.js';

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