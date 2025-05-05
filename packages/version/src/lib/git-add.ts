import { relative, resolve as pathResolve } from 'node:path';

import type { ExecOpts } from '@lerna-lite/core';
import { exec } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import slash from 'slash';

/**
 * @param {string[]} changedFiles
 * @param {{ granularPathspec: boolean; }} gitOpts
 * @param {import('@lerna/child-process').ExecOpts} execOpts
 */
export function gitAdd(changedFiles: string[], gitOpts: { granularPathspec: boolean }, execOpts: ExecOpts, dryRun = false) {
  // granular pathspecs should be relative to the git root, but that isn't necessarily where lerna-lite lives
  const files = gitOpts.granularPathspec
    ? changedFiles.map((file) => slash(relative(execOpts.cwd, pathResolve(execOpts.cwd, file))))
    : '.';

  log.silly('gitAdd', files.toString());

  return exec('git', ['add', '--', ...files], execOpts, dryRun);
}
