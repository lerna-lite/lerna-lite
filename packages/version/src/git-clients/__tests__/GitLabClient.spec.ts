import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { GitLabClient } from '../GitLabClient.js';

describe('GitLabClient', () => {
  let originalFetch: any;
  let fetchMock: Mock;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ test: 100 }),
      })
    ) as Mock;
    fetchMock = global.fetch as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    fetchMock = undefined as any;
  });

  describe('constructor', () => {
    it('sets `baseUrl` and `token`', () => {
      const client = new GitLabClient('TOKEN', 'http://some/host');

      expect(client.baseUrl).toEqual('http://some/host');
      expect(client.token).toEqual('TOKEN');
    });
  });

  describe('releasesUrl', () => {
    it('returns a GitLab releases API URL', () => {
      const client = new GitLabClient('TOKEN', 'http://some/host');
      const url = client.releasesUrl('the-namespace', 'the-project');

      expect(url).toEqual('http://some/host/projects/the-namespace%2Fthe-project/releases');
    });
  });

  describe('createRelease', () => {
    it('requests releases api with release', async () => {
      const client = new GitLabClient('TOKEN', 'http://some/host');
      fetchMock.mockResolvedValue({ ok: true });
      const release = {
        owner: 'the-owner',
        repo: 'the-repo',
        name: 'the-name',
        tag_name: 'the-tag_name',
        body: 'the-body',
      };

      await client.createRelease(release);

      expect(fetchMock).toHaveBeenCalledWith('http://some/host/projects/the-owner%2Fthe-repo/releases', {
        method: 'post',
        body: JSON.stringify({
          name: 'the-name',
          tag_name: 'the-tag_name',
          description: 'the-body',
        }),
        headers: {
          'PRIVATE-TOKEN': 'TOKEN',
          'Content-Type': 'application/json',
        },
      });
    });
  });
});