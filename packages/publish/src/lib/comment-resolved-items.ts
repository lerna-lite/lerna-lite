import { type Logger } from '@lerna-lite/npmlog';
import { getOldestCommitSinceLastTag, type OctokitClientOutput, parseGitRepo } from '@lerna-lite/version';
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
  startDate: string,
  logger: Logger
) {
  const q =
    type === 'issue'
      ? `repo:${owner}/${repo}+is:issue+state:closed+linked:pr+updated:>${startDate}`
      : `repo:${owner}/${repo}+type:pr+merged:>${startDate}`;
  logger.verbose('comments', `remote PR search query: ${q}`);
  return (await client.search!.issuesAndPullRequests({ q, advanced_search: true })).data.items;
}

export async function commentResolvedItems({
  client,
  commentFilterKeywords,
  gitRemote,
  execOpts,
  dryRun,
  independent,
  logger,
  version,
  tag,
  templates,
}: CommentResolvedOptions) {
  const repo: any = parseGitRepo(gitRemote, execOpts);
  const previousTagLastCommit = getOldestCommitSinceLastTag(execOpts, independent, false);
  const logPrefix = dryRun ? c.magenta('[dry-run] > ') : '';
  const filterStartDate = previousTagLastCommit.commitDate;

  // closed linked issues and/or merged pull requests
  let closedLinkedIssues: TypeNumberPair[] = [];
  let mergedPullRequests: TypeNumberPair[] = [];

  if (templates.issue) {
    closedLinkedIssues = (await remoteSearchBy(client, 'issue', repo.owner, repo.name, filterStartDate, logger)).map((item) => ({
      type: 'issue',
      number: item.number,
    }));
    logger.verbose('comments', `Closed linked issues: ${closedLinkedIssues.map((c) => c.number).join(', ')}`);
  }

  if (templates.issue) {
    mergedPullRequests = (await remoteSearchBy(client, 'pr', repo.owner, repo.name, filterStartDate, logger))
      .filter((item) => commentFilterKeywords.some((startWord) => item.title.toLowerCase().startsWith(startWord.toLowerCase())))
      .map((item) => ({ type: 'pr', number: item.number }));
    logger.verbose('comments', `Merged Pull Requests: ${mergedPullRequests.map((c) => c.number).join(', ')}`);
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
          client.issues!.createComment({
            owner: repo.owner,
            repo: repo.name,
            issue_number: number,
            body: comment,
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
