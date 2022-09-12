import dedent from 'dedent';
import log from 'npmlog';

import { createGitHubClient, parseGitRepo } from '../git-clients';
import { ExecOpts, RemoteCommit } from '../models';

const QUERY_PAGE_SIZE = 100; // GitHub API is restricting max of 100 per query

/**
 * Get all commits from GitHub remote repository, using GitHub Graphql API, by providing a date to query from
 * https://docs.github.com/en/graphql/reference/objects#repository
 * @param {RemoteClientType} client
 * @param {String} gitRemote
 * @param {String} branchName
 * @param {ExecOpts} execOpts
 * @returns {Promise<RemoteCommit[]>}
 */
export async function getGithubCommits(
  gitRemote: string,
  branchName: string,
  sinceDate: string,
  execOpts?: ExecOpts
): Promise<RemoteCommit[]> {
  const repo = parseGitRepo(gitRemote, execOpts);
  const octokit = createGitHubClient();
  const remoteCommits: Array<RemoteCommit> = [];
  let afterCursor = '';
  let hasNextPage = false;

  do {
    const afterCursorStr = afterCursor ? `, after: "${afterCursor}"` : '';
    const queryStr = dedent(
      `query getCommits($repo: String!, $owner: String!, $branchName: String!, $pageSize: Int!, $since: GitTimestamp!) {
          repository(name: $repo, owner: $owner) {
            ref(qualifiedName: $branchName) {
              target { ... on Commit {
                  history(first: $pageSize, since: $since ${afterCursorStr}) {
                    nodes { oid, message, author { name, user { login }}}
                    pageInfo { hasNextPage, endCursor }
        }}}}}}`
    ).trim();

    const response: GraphqlCommitClientData = await octokit.graphql(queryStr, {
      owner: repo.owner,
      repo: repo.name,
      afterCursor,
      branchName,
      pageSize: QUERY_PAGE_SIZE,
      since: sinceDate,
    });

    const historyData = getDescendantObjectProp<GraphqlCommitHistoryData>(response, 'repository.ref.target.history');
    const pageInfo = historyData?.pageInfo;
    hasNextPage = pageInfo?.hasNextPage ?? false;
    afterCursor = pageInfo?.endCursor ?? '';

    if (historyData?.nodes) {
      for (const commit of historyData.nodes) {
        if (commit?.oid && commit?.author) {
          remoteCommits.push({
            shortHash: commit.oid.substring(0, 7),
            authorName: commit?.author.name,
            login: commit?.author?.user?.login ?? '',
            message: commit?.message ?? '',
          });
        }
      }
    }
  } while (hasNextPage);

  log.verbose('github', 'found %s commits since last release timestamp %s', remoteCommits.length, sinceDate);

  return remoteCommits;
}

/**
 * From a dot (.) notation path, find and return a property within an object given a complex object path
 * Note that the object path does should not include the parent itself
 * for example if we want to get `address.zip` from `user` object, we would call `getDescendantObjectProp(user, 'address.zip')`
 * @param object - object to search from
 * @param path - complex object path to find descendant property from, must be a string with dot (.) notation
 * @returns outputValue - the object property value found if any
 */
export function getDescendantObjectProp<T>(object: any, path: string | undefined): T {
  if (!object || !path) {
    return object;
  }
  return path.split('.').reduce((obj, prop) => obj && (obj as any)[prop], object);
}

interface GraphqlCommitClientData {
  repository?: {
    ref?: {
      target?: {
        history?: GraphqlCommitHistoryData;
      };
    };
  };
}

interface GraphqlCommitHistoryData {
  nodes: Array<{ oid: string; message: string; author: { name: string; user: { login: string } } }>;
  pageInfo: { hasNextPage: boolean; endCursor: string; startCursor: string };
}
