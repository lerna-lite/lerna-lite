import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as githubClient from '../git-clients/github-client.js';
import { createRelease, truncateReleaseBody } from '../lib/create-release.js';

// Mock parseGitRepo to avoid git command errors
vi.spyOn(githubClient, 'parseGitRepo').mockImplementation(() => ({
  owner: 'lerna-lite',
  name: 'lerna-lite',
  host: 'github.com',
  href: 'https://github.com/lerna-lite/lerna-lite',
  password: '',
  pathname: '/lerna-lite/lerna-lite',
  port: '',
  protocol: 'https:',
  protocols: ['https'],
  ref: '',
  filepath: '',
  hash: '',
  query: {},
  search: '',
  token: '',
  user: '',
  organization: 'lerna-lite',
  source: 'github.com',
  parse_failed: false,
  toString: () => 'https://github.com/lerna-lite/lerna-lite',
  filepathtype: '',
  filepathtypeOriginal: '',
  git_suffix: false,
  resource: 'github.com',
  full_name: 'lerna-lite/lerna-lite',
}));

describe('truncateReleaseBody', () => {
  const generateRandomString = (length: number): string => {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  };

  it('should not truncate when body length is within limit for GitHub', () => {
    const body = generateRandomString(124999);
    const truncatedBody = truncateReleaseBody(body, 'github');
    expect(truncatedBody).toBe(body);
  });

  it('should not truncate when body length is within limit for GitLab', () => {
    const body = generateRandomString(999999);
    const truncatedBody = truncateReleaseBody(body, 'gitlab');
    expect(truncatedBody).toBe(body);
  });

  it('should truncate when body length exceeds limit for GitHub', () => {
    const body = generateRandomString(125001);
    const truncatedBody = truncateReleaseBody(body, 'github');
    expect(truncatedBody.length).toBe(125000);
    expect(truncatedBody.endsWith('...')).toBe(true);
  });

  it('should truncate when body length exceeds limit for GitLab', () => {
    const body = generateRandomString(1000001);
    const truncatedBody = truncateReleaseBody(body, 'gitlab');
    expect(truncatedBody.length).toBe(1000000);
    expect(truncatedBody.endsWith('...')).toBe(true);
  });

  it('should return the body as is when type is undefined', () => {
    const body = generateRandomString(150000);
    const truncatedBody = truncateReleaseBody(body);
    expect(truncatedBody).toBe(body);
  });
});

// Utility to help debug test failures
function getMockCall(mockFn: any) {
  if (!mockFn.mock || !mockFn.mock.calls || mockFn.mock.calls.length === 0) {
    throw new Error('mockClient.repos.createRelease was not called');
  }
  return mockFn.mock.calls[0][0];
}

describe('createRelease header/footer options', () => {
  let mockClient: any;
  let baseArgs: any;
  let baseCmdProps: any;
  const execOpts = { cwd: process.cwd() };
  const gitRemote = 'git@github.com:lerna-lite/lerna-lite.git';
  let originalGhToken: string | undefined;

  beforeEach(() => {
    // Set a fake GH_TOKEN so createRelease always calls the mock
    originalGhToken = process.env.GH_TOKEN;
    process.env.GH_TOKEN = 'fake-token';
    mockClient = {
      repos: {
        createRelease: vi.fn().mockResolvedValue({}),
      },
    };
    baseArgs = {
      client: mockClient,
      type: 'github',
      generateReleaseNotes: false,
      releaseDiscussion: undefined,
    };
    baseCmdProps = {
      tags: ['v1.2.3'],
      releaseNotes: [{ notes: 'Release notes body', name: 'fixed', pkg: { name: 'pkg-1', version: '1.2.3' } }],
      tagVersionSeparator: '',
    };
  });

  afterEach(() => {
    mockClient.repos.createRelease.mockClear();
    // Restore original GH_TOKEN
    if (originalGhToken === undefined) {
      delete process.env.GH_TOKEN;
    } else {
      process.env.GH_TOKEN = originalGhToken;
    }
  });

  it('applies releaseHeaderMessage and releaseFooterMessage with tokens', async () => {
    await createRelease(
      baseArgs,
      baseCmdProps,
      {
        gitRemote,
        execOpts,
        releaseHeaderMessage: 'Header %s %v',
        releaseFooterMessage: 'Footer %s %v',
      },
      false
    );
    const call = getMockCall(mockClient.repos.createRelease);
    expect(call.body).toContain('Header v1.2.3 1.2.3');
    expect(call.body).toContain('Footer v1.2.3 1.2.3');
    expect(call.body).toContain('Release notes body');
    // header should be at the top, footer at the bottom
    expect(call.body.startsWith('Header v1.2.3 1.2.3')).toBe(true);
    expect(call.body.trim().endsWith('Footer v1.2.3 1.2.3')).toBe(true);
  });

  it('works with only header or only footer', async () => {
    await createRelease(
      baseArgs,
      baseCmdProps,
      {
        gitRemote,
        execOpts,
        releaseHeaderMessage: 'HeaderOnly',
      },
      false
    );
    let call = getMockCall(mockClient.repos.createRelease);
    expect(call.body.startsWith('HeaderOnly')).toBe(true);
    expect(call.body).toContain('Release notes body');

    mockClient.repos.createRelease.mockClear();
    await createRelease(
      baseArgs,
      baseCmdProps,
      {
        gitRemote,
        execOpts,
        releaseFooterMessage: 'FooterOnly',
      },
      false
    );
    call = getMockCall(mockClient.repos.createRelease);
    expect(call.body).toContain('Release notes body');
    expect(call.body.trim().endsWith('FooterOnly')).toBe(true);
  });

  it('does not add header/footer if not provided', async () => {
    await createRelease(
      baseArgs,
      baseCmdProps,
      {
        gitRemote,
        execOpts,
      },
      false
    );
    const call = getMockCall(mockClient.repos.createRelease);
    expect(call.body).toBe('Release notes body');
  });
});
