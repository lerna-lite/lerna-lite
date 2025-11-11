import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { execSync } from '@lerna-lite/core';
import { Octokit } from '@octokit/rest';

import { createGitHubClient, parseGitRepo } from '../github-client.js';

vi.mock('@octokit/rest');
vi.mock('@lerna-lite/core');

(execSync as Mock).mockReturnValue('5.6.0');

describe('createGitHubClient', () => {
  beforeEach(() => {
    delete process.env.GH_TOKEN;
    delete process.env.GHE_VERSION;
    delete process.env.GHE_API_URL;
    delete process.env.GITHUB_TOKEN;
  });

  it('does not error if GH_TOKEN env var is set', () => {
    process.env.GH_TOKEN = 'TOKEN';

    expect(async () => {
      await createGitHubClient();
    }).not.toThrow();
  });

  it('does not error if GITHUB_TOKEN env var is set', () => {
    process.env.GITHUB_TOKEN = 'TOKEN';

    expect(async () => {
      await createGitHubClient();
    }).not.toThrow();
  });

  it('initializes GHE plugin when GHE_VERSION env var is set', async () => {
    process.env.GH_TOKEN = 'TOKEN';
    process.env.GHE_VERSION = '2.18';

    await createGitHubClient();

    expect(Octokit.plugin).toHaveBeenCalledWith(expect.anything());
  });

  it('initializes GHE plugin when GHE_VERSION env var is set with GITHUB_TOKEN', async () => {
    process.env.GITHUB_TOKEN = 'TOKEN';
    process.env.GHE_VERSION = '2.18';

    await createGitHubClient();

    expect(Octokit.plugin).toHaveBeenCalledWith(expect.anything());
  });

  it('sets octokit `baseUrl` when GHE_API_URL is set', async () => {
    process.env.GH_TOKEN = 'TOKEN';
    process.env.GHE_API_URL = 'http://some/host';

    await createGitHubClient();

    expect(Octokit).toHaveBeenCalledWith({
      auth: 'token TOKEN',
      baseUrl: 'http://some/host',
    });
  });
});

describe('parseGitRepo', () => {
  it('returns a parsed URL', () => {
    (execSync as Mock).mockReturnValue('git@github.com:org/lerna.git');

    const repo = parseGitRepo();

    expect(execSync).toHaveBeenCalledWith('git', ['config', '--get', 'remote.origin.url'], undefined);

    expect(repo).toEqual(
      expect.objectContaining({
        name: 'lerna',
        owner: 'org',
      })
    );
  });

  it('can change the origin', () => {
    (execSync as Mock).mockReturnValue('git@github.com:org/lerna.git');

    parseGitRepo('upstream');

    expect(execSync).toHaveBeenCalledWith('git', ['config', '--get', 'remote.upstream.url'], undefined);
  });

  it('throws an error if no URL returned', () => {
    (execSync as Mock).mockReturnValue('');

    expect(() => parseGitRepo()).toThrow('Git remote URL could not be found using "origin".');
  });
});
