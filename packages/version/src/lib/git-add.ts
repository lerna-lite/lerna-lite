import log from 'npmlog';
import path from 'path';
import slash from 'slash';

import { exec, ExecOpts } from '@lerna-lite/core';

/**
 * @param {string[]} changedFiles
 * @param {{ granularPathspec: boolean; }} gitOpts
 * @param {import('@lerna/child-process').ExecOpts} execOpts
 */
export function gitAdd(changedFiles: string[], gitOpts: { granularPathspec: boolean }, execOpts: ExecOpts, dryRun = false) {
  // granular pathspecs should be relative to the git root, but that isn't necessarily where lerna-lite lives
  const files = gitOpts.granularPathspec
    ? changedFiles.map((file) => slash(path.relative(execOpts.cwd, path.resolve(execOpts.cwd, file))))
    : '.';

  log.silly('gitAdd', files.toString());

  return exec('git', ['add', '--', ...files], execOpts, dryRun);
}
