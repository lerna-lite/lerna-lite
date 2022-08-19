import log from 'npmlog';

import { execSync } from '../child-process';
import { getGithubCommits } from './get-github-commits';
import { DescribeRefOptions, ExecOpts, RemoteClientType, RemoteCommit } from '../models';
import { describeRefSync } from '../utils/describe-ref';
import { ValidationError } from '../validation-error';

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
 * Find the oldest commit details since the last release tag or else if not tag exists then return first commit info
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
    log.silly('git', 'getCurrentBranchOldestCommitSinceLastTag');
    let stdout = execSync('git', ['log', `${lastTagName}..HEAD`, '--format="%h %aI"', '--reverse'], execOpts);
    if (!stdout) {
      // in some occasion the previous git command might return nothing, in that case we'll return the tag detail instead
      stdout = execSync('git', ['log', '-1', '--format="%h %aI"', lastTagName], execOpts);
    }
    [commitResult] = stdout.split('\n');
  } else {
    log.silly('git', 'getCurrentBranchFirstCommit');
    commitResult = execSync(
      'git',
      ['log', '--oneline', '--format="%h %aI"', '--reverse', '--max-parents=0', 'HEAD'],
      execOpts
    );
  }

  const [, commitHash, commitDate] = /^"?([0-9a-f]+)\s([0-9\-T\:]*)"?$/.exec(commitResult) || [];
  return { commitHash, commitDate };
}
