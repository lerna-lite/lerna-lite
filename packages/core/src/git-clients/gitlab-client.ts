// @ts-ignore
import fetch from 'node-fetch';
import log from 'npmlog';
import path from 'path';
import { URL } from 'whatwg-url';

class GitLabClient {
  baseUrl: string;
  token: string;

  constructor(baseUrl = 'https://gitlab.com/api/v4', token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  createRelease({ owner, repo, name, tag_name: tagName, body }) {
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

  releasesUrl(namespace: string, project: string, releases: string) {
    return new URL(
      `${this.baseUrl}/${path.join('projects', encodeURIComponent(`${namespace}/${project}`), releases)}`
    ).toString();
  }
}

function OcktokitAdapter(client) {
  return { repos: { createRelease: client.createRelease.bind(client) } };
}

export function createGitLabClient() {
  const { GL_API_URL, GL_TOKEN } = process.env;

  log.silly('Creating a GitLab client...', '');

  if (!GL_TOKEN) {
    throw new Error('A GL_TOKEN environment variable is required.');
  }

  const client = new GitLabClient(GL_API_URL, GL_TOKEN);

  return OcktokitAdapter(client);
}
