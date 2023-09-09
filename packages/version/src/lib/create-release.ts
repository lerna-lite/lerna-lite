import { ValidationError } from '@lerna-lite/core';
import chalk from 'chalk';
import log from 'npmlog';
import newGithubReleaseUrl from 'new-github-release-url';
import semver from 'semver';

import { createGitHubClient, createGitLabClient, parseGitRepo } from '../git-clients/index.js';
import { GitClientReleaseOption, GitCreateReleaseClientOutput, ReleaseCommandProps, ReleaseOptions } from '../models/index.js';

export async function createReleaseClient(type: 'github' | 'gitlab'): Promise<GitCreateReleaseClientOutput> {
  switch (type) {
    case 'gitlab':
      return createGitLabClient();
    case 'github':
      return await createGitHubClient();
    /* c8 ignore next: guarded by yargs.choices() */
    default:
      throw new ValidationError('ERELEASE', 'Invalid release client type');
  }
}

/** Create a release on a remote client (github or gitlab) */
export function createRelease(
  { client, releaseDiscussion }: { client: GitCreateReleaseClientOutput; releaseDiscussion?: string },
  { tags, releaseNotes }: ReleaseCommandProps,
  { gitRemote, execOpts, skipBumpOnlyReleases }: ReleaseOptions,
  dryRun = false
) {
  const { GH_TOKEN } = process.env;
  const repo = parseGitRepo(gitRemote, execOpts);

  return Promise.all(
    releaseNotes.map(({ notes, name, pkg }) => {
      const tag = name === 'fixed' ? tags[0] : tags.find((t) => t.startsWith(`${name}@`));

      // when using independent mode, it could happen that a few version bump only releases are created
      // and since these aren't very useful for most users, user could choose to skip creating these releases when detecting a version bump only
      if (!tag || (skipBumpOnlyReleases && pkg?.isBumpOnlyVersion)) {
        return Promise.resolve();
      }

      const prereleaseParts = semver.prerelease(tag.replace(`${name}@`, '')) || [];

      // when the `GH_TOKEN` environment variable is not set,
      // we'll create a link to GitHub web interface form with the fields pre-populated
      if (!GH_TOKEN) {
        const releaseUrl = newGithubReleaseUrl({
          user: repo.owner,
          repo: repo.name,
          tag,
          isPrerelease: prereleaseParts.length > 0,
          title: tag,
          body: notes,
        });
        log.verbose('github', 'GH_TOKEN environment variable is not set');
        log.info('github', `🏷️ (GitHub Release web interface) - 🔗 ${releaseUrl}`);
        return Promise.resolve();
      }

      const releaseOptions: GitClientReleaseOption = {
        owner: repo.owner,
        repo: repo.name,
        tag_name: tag,
        name: tag,
        body: notes,
        draft: false,
        prerelease: prereleaseParts.length > 0,
      };

      // also optionally create a Discussion with the release (currently only works with GitHub)
      if (releaseDiscussion) {
        releaseOptions.discussion_category_name = releaseDiscussion;
      }

      if (dryRun) {
        log.info(chalk.bold.magenta('[dry-run] >'), `Create Release with repo options: `, JSON.stringify(releaseOptions));
        return Promise.resolve();
      }

      return client.repos.createRelease(releaseOptions);
    })
  );
}
