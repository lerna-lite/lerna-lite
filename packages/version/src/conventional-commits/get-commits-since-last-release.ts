import type { DescribeRefOptions, ExecOpts, RemoteClientType } from '@lerna-lite/core';
import { describeRefSync, execSync, ValidationError } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

import type { RemoteCommit } from '../interfaces.js';
import { getGithubCommits } from './get-github-commits.js';

/**
 * From the current branch, find all commits since the last tag release.
 * The output will be an array which include every commit short hash & user login
 * @param {RemoteClientType} client
 * @param {String} gitRemote
 * @param {String} branchName
 * @param {Boolean} [isIndependent]
 * @param {ExecOpts} [execOpts]
 * @returns {Promise<RemoteCommit[]>}
 */
export async function getCommitsSinceLastRelease(
  client: RemoteClientType,
  gitRemote: string,
  branchName: string,
  isIndependent?: boolean,
  execOpts?: ExecOpts
): Promise<RemoteCommit[]> {
  // get the last release tag date or the first commit date if no release tag found
  const { commitDate } = getOldestCommitSinceLastTag(execOpts, isIndependent, false);

  switch (client) {
    case 'github':
      return getGithubCommits(gitRemote, branchName, commitDate, execOpts);
    case 'gitlab':
    default:
      throw new ValidationError(
        'EREMOTE',
        'Invalid remote client type, "github" is currently the only supported client with the option --changelog-include-commits-client-login.'
      );
  }
}

/**
 * Find the oldest commit details since the last release tag or else if no tag exists then return first commit info
 * @param {ExecOpts} [execOpts]
 * @param {Boolean} [includeMergedTags]
 * @param {Boolean} [isIndependent]
 * @returns {*} - oldest commit detail (hash, date)
 */
export function getOldestCommitSinceLastTag(execOpts?: ExecOpts, isIndependent?: boolean, includeMergedTags?: boolean) {
  let commitResult = '';
  const describeOptions: DescribeRefOptions = { ...execOpts };
  if (isIndependent) {
    describeOptions.match = '*@*'; // independent tag pattern
  }
  const { lastTagName } = describeRefSync(describeOptions, includeMergedTags);

  if (lastTagName) {
    const gitCommandArgs = ['log', `${lastTagName}..HEAD`, '--format="%h %aI"', '--reverse'];
    log.silly('git', 'getCurrentBranchOldestCommitSinceLastTag');
    log.verbose('exec', `git ${gitCommandArgs.join(' ')}`);
    let stdout = execSync('git', gitCommandArgs, execOpts);
    if (!stdout) {
      // in some occasion the previous git command might return nothing, in that case we'll return the tag detail instead
      stdout = execSync('git', ['log', '-1', '--format="%h %aI"', lastTagName], execOpts) || '';
    }
    [commitResult] = stdout.split('\n');
  } else {
    const gitCommandArgs = ['log', '--oneline', '--format="%h %aI"', '--reverse', '--max-parents=0', 'HEAD'];
    log.silly('git', 'getCurrentBranchFirstCommit');
    log.verbose('exec', `git ${gitCommandArgs.join(' ')}`);
    commitResult = execSync('git', gitCommandArgs, execOpts);
  }

  // get the date of the last tag
  const tagDateArgs = ['log', '-1', '--format=%cd', '--date=iso-strict', lastTagName || ''];
  const tagDate = execSync('git', tagDateArgs, execOpts);

  const [, commitHash, commitDate] = /^"?([0-9a-f]+)\s([0-9\-Z.|+T:]*)"?$/.exec(commitResult) || [];
  // prettier-ignore
  log.verbose('oldestCommitSinceLastTag', `commit found since last tag: ${lastTagName} and date ${tagDate} - (SHA) ${commitHash} - ${commitDate} - last`);

  return { commitHash, commitDate, tagDate };
}
