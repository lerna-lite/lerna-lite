import { RemoteClientType, ValidationError } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import newGithubReleaseUrl from 'new-github-release-url';
import pc from 'picocolors';
import semver from 'semver';

import { createGitHubClient, createGitLabClient, parseGitRepo } from '../git-clients/index.js';
import { GitClientReleaseOption, GitCreateReleaseClientOutput, ReleaseCommandProps, ReleaseOptions } from '../models/index.js';

export async function createReleaseClient(type: 'github' | 'gitlab'): Promise<GitCreateReleaseClientOutput> {
  switch (type) {
    case 'gitlab':
      return createGitLabClient();
    case 'github':
      return await createGitHubClient();
    /* v8 ignore next: guarded by yargs.choices() */
    default:
      throw new ValidationError('ERELEASE', 'Invalid release client type');
  }
}

/** Create a release on a remote client (github or gitlab) */
export function createRelease(
  {
    client,
    type,
    generateReleaseNotes,
    releaseDiscussion,
  }: {
    client: GitCreateReleaseClientOutput;
    type: 'github' | 'gitlab';
    generateReleaseNotes?: boolean;
    releaseDiscussion?: string;
  },
  { tags, releaseNotes, tagVersionSeparator }: ReleaseCommandProps,
  { gitRemote, execOpts, skipBumpOnlyReleases }: ReleaseOptions,
  dryRun = false
) {
  const { GH_TOKEN, GITHUB_TOKEN } = process.env;
  const repo = parseGitRepo(gitRemote, execOpts);

  return Promise.all(
    releaseNotes.map(({ notes, name, pkg }) => {
      const tag = name === 'fixed' ? tags[0] : tags.find((t) => t.startsWith(`${name}${tagVersionSeparator}`));

      // when using independent mode, it could happen that a few version bump only releases are created
      // and since these aren't very useful for most users, user could choose to skip creating these releases when detecting a version bump only
      if (!tag || (skipBumpOnlyReleases && pkg?.isBumpOnlyVersion)) {
        return Promise.resolve();
      }

      const prereleaseParts = semver.prerelease(tag.replace(`${name}${tagVersionSeparator}`, '')) || [];
      const body = truncateReleaseBody(notes || '', type);

      // when the `GH_TOKEN` (or `GITHUB_TOKEN`) environment variable is not set,
      // we'll create a link to GitHub web interface form with the fields pre-populated
      if (type === 'github' && !GH_TOKEN && !GITHUB_TOKEN) {
        const releaseUrl = newGithubReleaseUrl({
          user: repo.owner,
          repo: repo.name,
          tag,
          isPrerelease: prereleaseParts.length > 0,
          title: tag,
          body,
        });
        log.verbose('github', 'GH_TOKEN (or GITHUB_TOKEN) environment variable could not be found');
        log.info('github', `🏷️ (GitHub Release web interface) - 🔗 ${releaseUrl}`);
        return Promise.resolve();
      }

      const releaseOptions: GitClientReleaseOption = {
        owner: repo.owner,
        repo: repo.name,
        tag_name: tag,
        draft: false,
        prerelease: prereleaseParts.length > 0,
      };

      // also optionally create a Discussion with the release (currently only works with GitHub)
      if (releaseDiscussion) {
        releaseOptions.discussion_category_name = releaseDiscussion;
      }

      // whether to automatically generate the `name` and `body` for this release
      // else we'll add the notes as the release description body & tag as the name
      if (generateReleaseNotes) {
        releaseOptions.generate_release_notes = generateReleaseNotes;
      } else {
        releaseOptions.name = tag;
        releaseOptions.body = body;
      }

      if (dryRun) {
        log.info(pc.bold(pc.magenta('[dry-run] >')), `Create Release with repo options: `, JSON.stringify(releaseOptions));
        return Promise.resolve();
      }

      return client.repos.createRelease(releaseOptions);
    })
  );
}

export function truncateReleaseBody(body: string, type?: RemoteClientType) {
  let maxReleaseBodyLength: number | undefined;

  switch (type) {
    case 'gitlab':
      maxReleaseBodyLength = 1000000;
      break;
    case 'github':
      maxReleaseBodyLength = 125000;
      break;
    default:
      return body;
  }

  if (body.length > maxReleaseBodyLength) {
    const ellipsis = '...';
    return body.slice(0, maxReleaseBodyLength - ellipsis.length) + ellipsis;
  }
  return body;
}
