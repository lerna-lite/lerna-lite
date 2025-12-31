import { type Logger } from '@lerna-lite/npmlog';
import { type OctokitClientOutput, parseGitRepo } from '@lerna-lite/version';
import c from 'tinyrainbow';

import type { CommentResolvedOptions } from '../interfaces.js';
import { RateLimiter } from './rate-limiter.js';

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
  prevTagDate = '',
  logger,
  version,
  tag,
  templates,
}: CommentResolvedOptions) {
  const repo: any = parseGitRepo(gitRemote, execOpts);
  const logPrefix = dryRun ? c.magenta('[dry-run] > ') : '';

  // Use a Map to ensure uniqueness
  const closedLinkedIssues = new Map<number, TypeNumberPair>();
  const mergedPullRequests = new Map<number, TypeNumberPair>();

  if (templates.issue) {
    const issues = await remoteSearchBy(client, 'issue', repo.owner, repo.name, prevTagDate, logger);
    issues.forEach((item) => {
      closedLinkedIssues.set(item.number, { type: 'issue', number: item.number });
    });
  }

  if (templates.pullRequest) {
    const pullRequests = (await remoteSearchBy(client, 'pr', repo.owner, repo.name, prevTagDate, logger)).filter((item) =>
      commentFilterKeywords.some((startWord) => item.title.toLowerCase().startsWith(startWord.toLowerCase()))
    );
    pullRequests.forEach((item) => {
      mergedPullRequests.set(item.number, { type: 'pr', number: item.number });
    });
    logger.verbose(
      'comments',
      `Merged Pull Requests: ${Array.from(mergedPullRequests.values())
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
          // Only add if not already present
          if (!closedLinkedIssues.has(issueNumber)) {
            closedLinkedIssues.set(issueNumber, { type: 'issue', number: issueNumber });
          }
        }
      });
    }
  }

  // issues could be added in 2 places, so let's log them here
  if (templates.issue) {
    logger.verbose(
      'comments',
      `Closed linked issues: ${Array.from(closedLinkedIssues.values())
        .map((c) => c.number)
        .join(', ')}`
    );
  }

  const repository = `${repo.owner}/${repo.name}`;
  const hostURL = `https://${repo.host}/${repository}`;
  const releaseUrl = getReleaseUrlFallback(repo.host, repository, tag);

  // Create a rate limiter for GitHub API
  const rateLimiter = new RateLimiter({
    maxCalls: 30, // 30 calls per minute
    firstRunMaxCalls: 27, // 27/min since we need to remove 3 calls that were called before (1x graphql, 1x issues, 1x PRs)
    perMilliseconds: 60000, // per minute
  });

  const commentResults: Promise<{
    type: 'issue' | 'pr';
    number: number;
    url: string;
    comment: string;
    success: boolean;
  }>[] = [];

  for (const item of [...closedLinkedIssues.values(), ...mergedPullRequests.values()]) {
    const { type, number } = item;
    const url = `${hostURL}/${type === 'pr' ? 'pull' : 'issues'}/${number}`;
    let template = (type === 'pr' ? templates.pullRequest : templates.issue) || '';
    const comment = template
      .replace(/%s/g, tag || '')
      .replace(/%v/g, version || '')
      .replace(/%u/g, releaseUrl);

    if (!dryRun) {
      commentResults.push(
        rateLimiter.throttle(async () => {
          try {
            await client.issues!.createComment({
              owner: repo.owner,
              repo: repo.name,
              issue_number: number,
              body: comment,
            });

            logger.info('comments', `${logPrefix}● Commented on ${type === 'pr' ? 'PR' : 'issue'} ${url}`);
            logger.silly('comments', `${logPrefix}${comment}`);

            return { type, number, url, comment, success: true };
          } catch (error) {
            logger.info('comments', `${logPrefix}✕ Failed to comment on ${url}`);
            return { type, number, url, comment, success: false };
          }
        })
      );
    } else {
      // For dry run, still log the intention
      logger.info('comments', `${logPrefix}● Would comment on ${type === 'pr' ? 'PR' : 'issue'} ${url}`);
      logger.silly('comments', `${logPrefix}${comment}`);
    }
  }

  // If you want to handle the results
  const results = await Promise.all(commentResults);

  // Optional: Log summary of comments
  const successfulComments = results.filter((r) => r.success);
  const failedComments = results.filter((r) => !r.success);

  logger.info('comments', `Successful count: ${successfulComments.length}`);
  if (failedComments.length > 0) {
    logger.warn('comments', `Failed comments: ${failedComments.length}`);
  }

  return results;
}
