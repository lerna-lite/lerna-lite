import { createGitHubClient } from '../git-clients';

/**
 * @param {ReturnType<typeof createReleaseClient>} client
 * @param {{ tags: string[]; releaseNotes: { name: string; notes: string; }[] }} commandProps
 * @param {{ gitRemote: string; execOpts: import('@lerna/child-process').ExecOpts }} opts
 */
export async function getClientCommitDetail(client = 'github', repoName: string, repoOwner: string, since: string) {
  if (client === 'github') {
    // https://api.github.com/repos/ghiscoding/lerna-lite/commits?since=2022-07-01&per_page=5000
    // https://api.github.com/repos/OWNER/REPO/commits?since=2022-07-01&per_page=5000
    const octokit = createGitHubClient();
    const response = await octokit.graphql(
      `query getCommits($repo: String!, $owner: String!, $since: GitTimestamp!) {
        repository(name: $repo, owner: $owner) {
          defaultBranchRef {
            target {
              ... on Commit {
                history(first: 100, since: $since) {
                nodes {
                    oid
                    commitUrl
                    author {
                      user {
                        login
                      }
                      name
                    }
                    message
                }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    endCursor
                  }
                  totalCount
                }
              }
            }
          }
        }
      }`,
      { owner: repoOwner, repo: repoName, since }
    );

    const commits = response?.repository?.defaultBranchRef?.target?.history?.nodes;
    const lastCommits: Array<{ sha: string; login: string; message: string }> = [];
    if (commits) {
      for (const commit of commits) {
        lastCommits.push({
          sha: commit.oid,
          login: commit?.author?.user?.login ?? '',
          message: commit.message,
        });
      }
    }

    return lastCommits;
  }
}
