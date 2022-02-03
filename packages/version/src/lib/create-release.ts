import log from 'npmlog';
import semver from 'semver';

import { createGitHubClient, createGitLabClient, parseGitRepo, ValidationError } from '@ws-conventional-version-roller/core';

/**
 * @param {'github' | 'gitlab'} type
 */
export function createReleaseClient(type: string) {
  switch (type) {
    case 'gitlab':
      return createGitLabClient();
    case 'github':
      return createGitHubClient();
    /* istanbul ignore next: guarded by yargs.choices() */
    default:
      throw new ValidationError('ERELEASE', 'Invalid release client type');
  }
}

/**
 * @param {ReturnType<typeof createReleaseClient>} client
 * @param {{ tags: string[]; releaseNotes: { name: string; notes: string; }[] }} commandProps
 * @param {{ gitRemote: string; execOpts: import('@lerna/child-process').ExecOpts }} opts
 */
export function createRelease(client, { tags, releaseNotes }, { gitRemote, execOpts }, gitDryRun = false) {
  const repo = parseGitRepo(gitRemote, execOpts, gitDryRun);

  return Promise.all(
    releaseNotes.map(({ notes, name }) => {
      const tag = name === 'fixed' ? tags[0] : tags.find((t) => t.startsWith(`${name}@`));

      /* istanbul ignore if */
      if (!tag) {
        return Promise.resolve();
      }

      const prereleaseParts = semver.prerelease(tag.replace(`${name}@`, '')) || [];

      if (gitDryRun) {
        log.info('dry-run>', `Release Created`);
        return {};
      }

      return client.repos.createRelease({
        owner: repo.owner,
        repo: repo.name,
        tag_name: tag,
        name: tag,
        body: notes,
        draft: false,
        prerelease: prereleaseParts.length > 0,
      });
    })
  );
}
