import { execSync } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { Octokit } from '@octokit/rest';
import { type SyncOptions } from 'execa';
import parseGitUrl from 'git-url-parse';

export async function createGitHubClient() {
  log.silly('createGitHubClient', '');

  const { GH_TOKEN, GITHUB_TOKEN, GHE_API_URL, GHE_VERSION } = process.env;
  const options: { auth?: string; baseUrl?: string } = {};

  if (GH_TOKEN || GITHUB_TOKEN) {
    options.auth = `token ${GH_TOKEN || GITHUB_TOKEN}`;
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
