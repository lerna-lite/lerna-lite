import type { ExecOpts } from '@lerna-lite/core';
import { exec } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

/**
 * @param {string} remote
 * @param {string} branch
 * @param {import('@lerna/child-process').ExecOpts} opts
 */
export function gitPush(remote: string, branch: string, opts: ExecOpts, dryRun = false): Promise<void> {
  log.silly('gitPush', remote, branch);

  return exec('git', ['push', '--follow-tags', '--no-verify', '--atomic', remote, branch], opts, dryRun).catch((error: any) => {
    // @see https://github.com/sindresorhus/execa/blob/v1.0.0/index.js#L159-L179
    // the error message _should_ be on stderr except when GIT_REDIRECT_STDERR has been configured to redirect
    // to stdout. More details in https://git-scm.com/docs/git#Documentation/git.txt-codeGITREDIRECTSTDERRcode
    if (
      /does not support --atomic/.test(error.stderr) ||
      (process.env.GIT_REDIRECT_STDERR === '2>&1' && /does not support --atomic/.test(error.stdout))
    ) {
      // childProcess.exec has propagated the error code to the process exit code --
      // we'll clear it here as it will not propagate a success code
      process.exitCode = 0;

      // --atomic is only supported in git >=2.4.0, which some crusty CI environments deem unnecessary to upgrade.
      // so let's try again without attempting to pass an option that is almost 5 years old as of this writing...
      log.warn('gitPush', error.stderr);
      log.info('gitPush', '--atomic failed, attempting non-atomic push');

      return exec('git', ['push', '--follow-tags', '--no-verify', remote, branch], opts, dryRun);
    }

    // ensure unexpected errors still break chain
    throw error;
  });
}

/**
 * @param {string} tag
 * @param {string} remote
 * @param {string} branch
 * @param {import('@lerna/child-process').ExecOpts} opts
 */
export function gitPushSingleTag(remote: string, branch: string, tag: string, opts: ExecOpts, dryRun = false): Promise<void> {
  log.silly('gitPush', remote, branch);

  return exec('git', ['push', '--no-verify', '--atomic', remote, tag, branch], opts, dryRun).catch((error: any) => {
    // @see https://github.com/sindresorhus/execa/blob/v1.0.0/index.js#L159-L179
    // the error message _should_ be on stderr except when GIT_REDIRECT_STDERR has been configured to redirect
    // to stdout. More details in https://git-scm.com/docs/git#Documentation/git.txt-codeGITREDIRECTSTDERRcode
    if (
      /does not support --atomic/.test(error.stderr) ||
      (process.env.GIT_REDIRECT_STDERR === '2>&1' && /does not support --atomic/.test(error.stdout))
    ) {
      // childProcess.exec has propagated the error code to the process exit code --
      // we'll clear it here as it will not propagate a success code
      process.exitCode = 0;

      // --atomic is only supported in git >=2.4.0, which some crusty CI environments deem unnecessary to upgrade.
      // so let's try again without attempting to pass an option that is almost 5 years old as of this writing...
      log.warn('gitPush', error.stderr);
      log.info('gitPush', '--atomic failed, attempting non-atomic push');

      return exec('git', ['push', '--no-verify', remote, tag, branch], opts, dryRun);
    }

    // ensure unexpected errors still break chain
    throw error;
  });
}