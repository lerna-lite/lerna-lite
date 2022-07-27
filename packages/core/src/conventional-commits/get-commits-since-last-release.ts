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
 * @param {ExecOpts} execOpts
 * @returns {Promise<RemoteCommit[]>}
 */
export async function getCommitsSinceLastRelease(
  client: RemoteClientType,
  gitRemote: string,
  branchName: string,
  execOpts: ExecOpts
): Promise<RemoteCommit[]> {
  // get the last release tag date or the first commit date if no release tag found
  const { tagDate } = getLastTagDetails(execOpts, false);

  switch (client) {
    case 'github':
      return getGithubCommits(gitRemote, branchName, tagDate, execOpts);
    case 'gitlab':
    default:
      throw new ValidationError(
        'EREMOTE',
        'Invalid remote client type, "github" is currently the only supported client with the option --changelog-include-commits-client-login.'
      );
  }
}

/**
 * From the current branch, we will return the last tag date, sha and ref count
 * or else return it from the first commit of the current branch
 */
export function getLastTagDetails(execOpts: ExecOpts, includeMergedTags?: boolean) {
  let execResult = '';
  const describeOptions: DescribeRefOptions = { ...execOpts };
  const { refCount, lastTagName } = describeRefSync(describeOptions, includeMergedTags);

  if (lastTagName) {
    log.silly('git', 'getCurrentBranchLastTagDateSha');
    execResult = execSync('git', ['log', '-1', '--format="%h %cI"', lastTagName], execOpts);
  } else {
    log.silly('git', 'getCurrentBranchFirstCommitDateSha');
    execResult = execSync(
      'git',
      ['log', '--oneline', '--format="%h %cI"', '--reverse', '--max-parents=0', 'HEAD'],
      execOpts
    );
  }

  const [_, tagHash, tagDate] = /^"?([0-9a-f]+)\s([0-9\-T\:]*)"?$/.exec(execResult) || [];
  return { tagHash, tagDate, tagRefCount: refCount };
}
