import { type GetCommitsParams } from '@conventional-changelog/git-client';
import type {
  CommitKnownProps,
  FinalTemplateContext,
  Options as WriterOptions,
  TransformedCommit,
} from 'conventional-changelog-writer';

import type { ChangelogConfig, RemoteCommit } from '../interfaces.js';

type AugmentedCommit = TransformedCommit<CommitKnownProps> & {
  authorEmail?: string;
  authorName?: string;
  userLogin?: string;
};

// Legacy preset compatibility: remove these widened commit helpers when we no longer support older preset shapes.
type CommitPartialFunction = NonNullable<WriterOptions<AugmentedCommit>['commitPartial']>;
type CommitTransformFunction = NonNullable<WriterOptions<AugmentedCommit>['transform']>;

// available formats can be found at Git's url: https://git-scm.com/docs/git-log#_pretty_formats
const GIT_COMMIT_WITH_AUTHOR_FORMAT =
  '%B%n-hash-%n%H%n-gitTags-%n%d%n-committerDate-%n%ci%n-authorName-%n%an%n-authorEmail-%n%ae%n-gpgStatus-%n%G?%n-gpgSigner-%n%GS';

/**
 * Change the changelog config, we need to update the default format to include commit author name/email,
 * Add a `format` to the `conventional-changelog-core` of `gitRawCommitsOpts` will make it available in the commit template
 * https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/git-raw-commits/index.js#L27
 * then no matter which changelog preset is loaded, we'll append the git author name to the commit template
 * ie:: **deps:** update all non-major dependencies ([ed1db35](https://github.com/.../ed1db35)) (Renovate Bot)
 * @param {ChangelogConfig} config
 * @param {GitRawCommitsOptions} gitRawCommitsOpts
 * @param {WriterOptions} writerOpts
 * @param {string | boolean} [commitCustomFormat]
 */
export function setConfigChangelogCommitGitAuthor(
  config: ChangelogConfig,
  gitRawCommitsOpts: GetCommitsParams,
  writerOpts: WriterOptions<AugmentedCommit>,
  commitCustomFormat?: string | boolean
) {
  gitRawCommitsOpts.format = GIT_COMMIT_WITH_AUTHOR_FORMAT;
  const extraCommitMsg =
    typeof commitCustomFormat === 'string' && commitCustomFormat !== '' ? commitCustomFormat : '({{authorName}})';
  const originalCommitPartial = config.writer?.commitPartial;

  // Legacy preset compatibility: keep string-based partials working until we drop v9-era preset support.
  writerOpts.commitPartial = ((context: FinalTemplateContext<AugmentedCommit>, commit: AugmentedCommit) => {
    const commitPartial =
      typeof originalCommitPartial === 'function' ? originalCommitPartial(context, commit) : originalCommitPartial || '';

    const authorName = commit.authorName || '';
    const authorEmail = commit.authorEmail || '';
    const renderedExtraCommitMsg = extraCommitMsg
      .replace(/%a/g, authorName)
      .replace(/%e/g, authorEmail)
      .replace(/\{\{authorName\}\}/g, authorName)
      .replace(/\{\{authorEmail\}\}/g, authorEmail);

    const extraCommitSuffix = renderedExtraCommitMsg
      ? `${renderedExtraCommitMsg.startsWith(' ') ? '' : ' '}${renderedExtraCommitMsg}`
      : '';

    return commitPartial.replace(/\n*$/, '') + (context.linkReferences ? extraCommitSuffix : '') + '\n';
  }) as CommitPartialFunction;
}

/**
 * Change the changelog config, we need to update the default format to include remote client login name.
 * We also need to extend the transform function and add remote client login (GitHub),
 * and finally no matter which changelog preset is loaded, we'll append the client login to the commit template
 * ie:: **deps:** update all non-major dependencies ([ed1db35](https://github.com/.../ed1db35)) (@renovate-bot)
 * @param {ChangelogConfig} config
 * @param {GetCommitsParams} gitRawCommitsOpts
 * @param {WriterOptions} writerOpts
 * @param {RemoteCommit[]} commitsSinceLastRelease
 * @param {string | boolean} [commitCustomFormat]
 */
export function setConfigChangelogCommitClientLogin(
  config: ChangelogConfig,
  gitRawCommitsOpts: GetCommitsParams,
  writerOpts: WriterOptions<AugmentedCommit>,
  commitsSinceLastRelease: RemoteCommit[],
  commitCustomFormat?: string | boolean
) {
  gitRawCommitsOpts.format = GIT_COMMIT_WITH_AUTHOR_FORMAT;
  const extraCommitMsg =
    typeof commitCustomFormat === 'string' && commitCustomFormat !== '' ? commitCustomFormat : ' (@{{userLogin}})';
  const originalCommitPartial = config.writer?.commitPartial;

  // Legacy preset compatibility: keep string-based partials working until we drop v9-era preset support.
  writerOpts.commitPartial = ((context: FinalTemplateContext<AugmentedCommit>, commit: AugmentedCommit) => {
    const commitPartial =
      typeof originalCommitPartial === 'function' ? originalCommitPartial(context, commit) : originalCommitPartial || '';

    const renderedExtraCommitMsg = extraCommitMsg
      .replace(/%a/g, commit.authorName || '')
      .replace(/%e/g, commit.authorEmail || '')
      .replace(/%l/g, commit.userLogin || '')
      .replace(/\{\{authorName\}\}/g, commit.authorName || '')
      .replace(/\{\{authorEmail\}\}/g, commit.authorEmail || '')
      .replace(/\{\{userLogin\}\}/g, commit.userLogin || '');

    const extraCommitSuffix = renderedExtraCommitMsg
      ? `${renderedExtraCommitMsg.startsWith(' ') ? '' : ' '}${renderedExtraCommitMsg}`
      : '';

    return commitPartial.replace(/\n*$/, '') + (context.linkReferences ? extraCommitSuffix : '') + '\n';
  }) as CommitPartialFunction;

  // Legacy preset compatibility: enrich transformed commits with remote login data until the next major removes this path.
  const originalTransform = config.writer?.transform;
  writerOpts.transform = ((commit, context, options) => {
    const transCommit = originalTransform?.(commit, context, options) || null;

    // add remote client detail (user login) when found
    if (transCommit) {
      const remoteCommit = commitsSinceLastRelease.find((c) => commit.hash?.startsWith(c.shortHash));
      if (remoteCommit?.login) {
        return { ...transCommit, userLogin: remoteCommit.login };
      }
    }

    return transCommit;
  }) as CommitTransformFunction;
}
