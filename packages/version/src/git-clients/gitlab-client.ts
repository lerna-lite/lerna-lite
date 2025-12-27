import { log } from '@lerna-lite/npmlog';

import type { OctokitClientOutput } from '../interfaces.js';
import { GitLabClient } from './GitLabClient.js';

function OcktokitAdapter(client): OctokitClientOutput {
  return { repos: { createRelease: client.createRelease.bind(client) } };
}

export function createGitLabClient() {
  const { GL_API_URL, GL_TOKEN } = process.env;

  log.silly('Creating a GitLab client...', '');

  if (!GL_TOKEN) {
    throw new Error('A GL_TOKEN environment variable is required.');
  }

  const client = new GitLabClient(GL_TOKEN, GL_API_URL);

  return OcktokitAdapter(client);
}