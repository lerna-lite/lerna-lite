import { execSync } from '@lerna-lite/core';
import { Octokit } from '@octokit/rest';
import { SyncOptions } from 'execa';
import parseGitUrl from 'git-url-parse';
import log from 'npmlog';

export async function createGitHubClient() {
  log.silly('createGitHubClient', '');

  const { GH_TOKEN, GHE_API_URL, GHE_VERSION } = process.env;
  const options: { auth?: string; baseUrl?: string } = {};

  if (GH_TOKEN) {
    options.auth = `token ${GH_TOKEN}`;
  }

  if (GHE_VERSION) {
    const plugin = await import(`@octokit/plugin-enterprise-rest/ghe-${GHE_VERSION}/index.js`);
    Octokit.plugin(plugin);
  }

  if (GHE_API_URL) {
    options.baseUrl = GHE_API_URL;
  }

  return new Octokit(options);
}

export function parseGitRepo(remote = 'origin', opts?: SyncOptions): parseGitUrl.GitUrl {
  log.silly('parseGitRepo', '');
  const args = ['config', '--get', `remote.${remote}.url`];
  log.verbose('git', args.join(' '));
  const url = execSync('git', args, opts);

  if (!url) {
    throw new Error(`Git remote URL could not be found using "${remote}".`);
  }

  return parseGitUrl(url);
}
