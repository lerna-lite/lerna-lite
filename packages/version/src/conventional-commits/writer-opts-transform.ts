import { Context, GitRawCommitsOptions } from 'conventional-changelog-core';
import { Options as WriterOptions } from 'conventional-changelog-writer';
import { Commit } from 'conventional-commits-parser';

import { ChangelogConfig, RemoteCommit } from '../interfaces.js';

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
  gitRawCommitsOpts: GitRawCommitsOptions,
  writerOpts: WriterOptions,
  commitCustomFormat?: string | boolean
) {
  gitRawCommitsOpts.format = GIT_COMMIT_WITH_AUTHOR_FORMAT;
  const extraCommitMsg =
    typeof commitCustomFormat === 'string' && commitCustomFormat !== ''
      ? commitCustomFormat.replace(/%a/g, '{{authorName}}').replace(/%e/g, '{{authorEmail}}')
      : `({{authorName}})`;

  const commitPartial = config.writer?.commitPartial || '';
  writerOpts.commitPartial = commitPartial.replace(/\n*$/, '') + ` {{#if @root.linkReferences~}}${extraCommitMsg}{{~/if}}\n`;
}

/**
 * Change the changelog config, we need to update the default format to include remote client login name.
 * We also need to extend the transform function and add remote client login (GitHub),
 * and finally no matter which changelog preset is loaded, we'll append the client login to the commit template
 * ie:: **deps:** update all non-major dependencies ([ed1db35](https://github.com/.../ed1db35)) (@renovate-bot)
 * @param {ChangelogConfig} config
 * @param {GitRawCommitsOptions} gitRawCommitsOpts
 * @param {WriterOptions} writerOpts
 * @param {RemoteCommit[]} commitsSinceLastRelease
 * @param {string | boolean} [commitCustomFormat]
 */
export function setConfigChangelogCommitClientLogin(
  config: ChangelogConfig,
  gitRawCommitsOpts: GitRawCommitsOptions,
  writerOpts: WriterOptions,
  commitsSinceLastRelease: RemoteCommit[],
  commitCustomFormat?: string | boolean
) {
  gitRawCommitsOpts.format = GIT_COMMIT_WITH_AUTHOR_FORMAT;
  const extraCommitMsg =
    typeof commitCustomFormat === 'string' && commitCustomFormat !== ''
      ? commitCustomFormat.replace(/%a/g, '{{authorName}}').replace(/%e/g, '{{authorEmail}}').replace(/%l/g, '{{userLogin}}')
      : ` (@{{userLogin}})`;

  const commitPartial = config.writer?.commitPartial || '';
  writerOpts.commitPartial = commitPartial.replace(/\n*$/, '') + `${extraCommitMsg}\n`;

  // add commits since last release into the transform function
  writerOpts.transform = writerOptsTransform.bind(
    null,
    config.writer.transform as unknown as (cmt: Commit, ctx: Context) => Commit,
    commitsSinceLastRelease
  ) as any;
}

/**
 * Extend the writerOpts transform function from whichever preset config is currently loaded
 * We will execute the original writerOpts transform function, then from it we'll add extra properties to the commit object
 * @param {Transform} originalTransform
 * @param {RemoteCommit[]} commitsSinceLastRelease
 * @param {Commit} commit
 * @param {Context} context
 * @returns
 */
export function writerOptsTransform(
  originalTransform: (cmt: Commit, ctx: Context) => Commit,
  commitsSinceLastRelease: RemoteCommit[],
  commit: Commit,
  context: Context
) {
  // Clone the commit object to avoid mutating the original
  const clonedCommit = { ...commit };

  // Add client remote detail (login)
  if (clonedCommit) {
    const shortHash = clonedCommit.shortHash || clonedCommit.hash?.substring(0, 7);
    const remoteCommit = commitsSinceLastRelease.find((c) => c.shortHash === shortHash);
    if (remoteCommit?.login) {
      clonedCommit.userLogin = remoteCommit.login;
    }
  }

  // Execute the original transform function
  const extendedCommit = originalTransform(clonedCommit, context);

  return extendedCommit;
}
