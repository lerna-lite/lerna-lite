import log from 'npmlog';
import semver from 'semver';

import {
  createGitHubClient,
  createGitLabClient,
  parseGitRepo,
  ReleaseCommandProps,
  ReleaseOptions,
  ValidationError
} from '@lerna-lite/core';

/**
 * @param {'github' | 'gitlab'} type
 */
export function createReleaseClient(type: 'github' | 'gitlab') {
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
export function createRelease(client, { tags, releaseNotes }: ReleaseCommandProps, { gitRemote, execOpts }: ReleaseOptions, gitDryRun = false) {
  const repo = parseGitRepo(gitRemote, execOpts);

  return Promise.all(
    releaseNotes.map(({ notes, name }) => {
      const tag = name === 'fixed' ? tags[0] : tags.find((t) => t.startsWith(`${name}@`));

      /* istanbul ignore if */
      if (!tag) {
        return Promise.resolve();
      }

      const prereleaseParts = semver.prerelease(tag.replace(`${name}@`, '')) || [];
      const releaseOptions = {
        owner: repo.owner,
        repo: repo.name,
        tag_name: tag,
        name: tag,
        body: notes,
        draft: false,
        prerelease: prereleaseParts.length > 0,
      };

      if (gitDryRun) {
        log.info('dry-run>', `Create Release with repo options: `, JSON.stringify(releaseOptions));
        return Promise.resolve();
      }

      return client.repos.createRelease(releaseOptions);
    })
  );
}
