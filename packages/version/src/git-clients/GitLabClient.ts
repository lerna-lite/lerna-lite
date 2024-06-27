import { log } from '@lerna-lite/npmlog';
import fetch from 'node-fetch';
import { join } from 'node:path';

import { GitClient, GitClientReleaseOption } from '../models/index.js';

export class GitLabClient implements GitClient {
  baseUrl: string;
  token: string;

  constructor(token: string, baseUrl = 'https://gitlab.com/api/v4') {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  createRelease({ owner, repo, name, tag_name: tagName, body }: GitClientReleaseOption): Promise<void> {
    const releasesUrl = this.releasesUrl(owner, repo, 'releases');

    log.silly('Requesting GitLab releases', releasesUrl);

    return fetch(releasesUrl, {
      method: 'post',
      body: JSON.stringify({ name, tag_name: tagName, description: body }),
      headers: {
        'PRIVATE-TOKEN': this.token,
        'Content-Type': 'application/json',
      },
    }).then(({ ok, status, statusText }) => {
      if (!ok) {
        log.error('gitlab', `Failed to create release\nRequest returned ${status} ${statusText}`);
      } else {
        log.silly('gitlab', 'Created release successfully.');
      }
    });
  }

  releasesUrl(namespace: string, project: string, releaseType = 'releases'): string {
    return new URL(`${this.baseUrl}/${join('projects', encodeURIComponent(`${namespace}/${project}`), releaseType)}`).toString();
  }
}
