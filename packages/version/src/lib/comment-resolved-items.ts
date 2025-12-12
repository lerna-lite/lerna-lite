import { type Logger } from '@lerna-lite/npmlog';
import { type OctokitClientOutput, parseGitRepo } from '@lerna-lite/version';
import c from 'tinyrainbow';

import type { CommentResolvedOptions } from '../interfaces';

interface TypeNumberPair {
  type: 'issue' | 'pr';
  number: number;
}

export function getReleaseUrlFallback(host: string, repository: string, tagName?: string) {
  let url = `https://${host}/${repository}/releases`;
  if (tagName) {
    url += `/tag/${tagName}`;
  }
  return url;
}

export async function remoteSearchBy(
  client: OctokitClientOutput,
  type: 'issue' | 'pr',
  owner: string,
  repo: string,
  startDate = '',
  logger: Logger
) {
  const dateCondition = startDate ? `:>${startDate}` : '';
  const q =
    type === 'issue'
      ? `repo:${owner}/${repo}+is:issue+linked:pr+closed${dateCondition}`
      : `repo:${owner}/${repo}+type:pr+merged${dateCondition}`;
  logger.verbose('comments', `remote PR search query: ${q}`);
  return (await client.search!.issuesAndPullRequests({ q, advanced_search: true })).data.items;
}

export async function commentResolvedItems({
  client,
  commentFilterKeywords,
  gitRemote,
  execOpts,
  dryRun,
  lastTagCommit,
  logger,
  version,
  tag,
  templates,
}: CommentResolvedOptions) {
  const repo: any = parseGitRepo(gitRemote, execOpts);
  const logPrefix = dryRun ? c.magenta('[dry-run] > ') : '';
  const lastTagDate = lastTagCommit?.tagDate || '';

  // closed linked issues and/or merged pull requests
  let closedLinkedIssues = new Set<TypeNumberPair>();
  let mergedPullRequests = new Set<TypeNumberPair>();

  if (templates.issue) {
    const issues = await remoteSearchBy(client, 'issue', repo.owner, repo.name, lastTagDate, logger);
    issues.forEach((item) => closedLinkedIssues.add({ type: 'issue', number: item.number }));
  }

  if (templates.pullRequest) {
    const pullRequests = (await remoteSearchBy(client, 'pr', repo.owner, repo.name, lastTagDate, logger)).filter((item) =>
      commentFilterKeywords.some((startWord) => item.title.toLowerCase().startsWith(startWord.toLowerCase()))
    );
    pullRequests.forEach((item) => mergedPullRequests.add({ type: 'pr', number: item.number }));
    logger.verbose(
      'comments',
      `Merged Pull Requests: ${Array.from(mergedPullRequests)
        .map((c) => c.number)
        .join(', ')}`
    );

    // issues might not be linked (fix keyword via description),
    // but the fix keyword might be in the PR title so let's add those as issues if they're not yet included
    if (templates.issue) {
      pullRequests.forEach((p) => {
        const match = p.title.match(/\b(fix|fixes)\s*#(\d+)/) || [];
        if (match.length >= 2) {
          const issueNumber = parseInt(match[2], 10);
          closedLinkedIssues.add({ type: 'issue', number: issueNumber });
        }
      });
    }
  }

  // issues could be added in 2 places, so let's log them here
  if (templates.issue) {
    logger.verbose(
      'comments',
      `Closed linked issues: ${Array.from(closedLinkedIssues)
        .map((c) => c.number)
        .join(', ')}`
    );
  }

  const repository = `${repo.owner}/${repo.name}`;
  const hostURL = `https://${repo.host}/${repository}`;
  const releaseUrl = getReleaseUrlFallback(repo.host, repository, tag);

  const promises: Promise<any>[] = [];
  for (const item of [...closedLinkedIssues, ...mergedPullRequests]) {
    const { type, number } = item;
    const url = `${hostURL}/${type === 'pr' ? 'pull' : 'issues'}/${number}`;
    let template = (type === 'pr' ? templates.pullRequest : templates.issue) || '';
    const comment = template
      .replace(/%s/g, tag || '')
      .replace(/%v/g, version || '')
      .replace(/%u/g, releaseUrl);

    try {
      if (!dryRun) {
        promises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(
                client.issues!.createComment({
                  owner: repo.owner,
                  repo: repo.name,
                  issue_number: number,
                  body: comment,
                })
              );
            }, 10000); // delay by 10sec. between each calls to avoid hitting GitHub rate limit
          })
        );
      }
      const commentType = type === 'pr' ? 'PR' : 'issue';
      logger.info('comments', `${logPrefix}● Commented on ${commentType} ${url}`);
      logger.silly('comments', `${logPrefix}${comment}`);
    } catch (_e) {
      /** v8 ignore next */
      logger.info('comments', `${logPrefix}✕ Failed to comment on ${url}`);
    }
  }

  await Promise.all(promises);
}
