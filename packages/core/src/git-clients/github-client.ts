import { Octokit } from '@octokit/rest';
import { SyncOptions } from 'execa';
import parseGitUrl from 'git-url-parse';
import log from 'npmlog';

import { execSync } from '../child-process';

export function createGitHubClient() {
  log.silly('createGitHubClient', '');

  const { GH_TOKEN, GHE_API_URL, GHE_VERSION } = process.env;

  if (!GH_TOKEN) {
    throw new Error('A GH_TOKEN environment variable is required.');
  }

  if (GHE_VERSION) {
    // eslint-disable-next-line
    Octokit.plugin(require(`@octokit/plugin-enterprise-rest/ghe-${GHE_VERSION}`));
  }

  const options: any = {
    auth: `token ${GH_TOKEN}`,
  };

  if (GHE_API_URL) {
    options.baseUrl = GHE_API_URL;
  }

  return new Octokit(options);
}

export function parseGitRepo(remote = 'origin', opts?: SyncOptions<string>): parseGitUrl.GitUrl {
  log.silly('parseGitRepo', '');
  const args = ['config', '--get', `remote.${remote}.url`];
  log.verbose('git', args.join(' '));
  const url = execSync('git', args, opts);

  if (!url) {
    throw new Error(`Git remote URL could not be found using "${remote}".`);
  }

  return parseGitUrl(url);
}
