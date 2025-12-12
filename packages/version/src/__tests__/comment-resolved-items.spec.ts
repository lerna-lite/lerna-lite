import { type Logger } from '@lerna-lite/npmlog';
import { describe, expect, it, vi } from 'vitest';

import type { CommentResolvedOptions, OctokitClientOutput } from '../interfaces.js';
import { commentResolvedItems, remoteSearchBy, getReleaseUrlFallback } from '../lib/comment-resolved-items.js';

vi.mock('../../git-clients/github-client', async () => ({
  ...(await vi.importActual<any>('../../git-clients/github-client')),
  createGitHubClient: (await vi.importActual<any>('../../__mocks__/github-client')).createGitHubClient,
  parseGitRepo: (await vi.importActual<any>('../../__mocks__/github-client')).parseGitRepo,
}));

// Mock dependencies
vi.mock('@lerna-lite/npmlog', () => ({
  type: {
    Logger: vi.fn(),
  },
}));

// Mock parseGitRepo
vi.mock('@lerna-lite/version', () => ({
  parseGitRepo: vi.fn().mockReturnValue({
    owner: 'owner',
    name: 'repo',
    host: 'github.com',
  }),
}));

describe('remoteSearchBy', () => {
  it('should construct correct query for issues', async () => {
    const mockClient = {
      search: {
        issuesAndPullRequests: vi.fn().mockResolvedValue({
          data: {
            items: [
              {
                number: 123,
                title: 'Test Issue',
                state: 'closed',
              },
            ],
          },
        }),
      },
    };

    const mockLogger = {
      verbose: vi.fn(),
    };

    const result = await remoteSearchBy(mockClient as any, 'issue', 'owner', 'repo', '2023-01-01', mockLogger as any);

    expect(mockClient.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: 'repo:owner/repo+is:issue+linked:pr+closed:>2023-01-01',
      advanced_search: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(123);
  });

  it('should construct correct query for pull requests', async () => {
    const mockClient = {
      search: {
        issuesAndPullRequests: vi.fn().mockResolvedValue({
          data: {
            items: [
              {
                number: 456,
                title: 'Test PR',
                merged_at: '2023-02-01',
              },
            ],
          },
        }),
      },
    };

    const mockLogger = {
      verbose: vi.fn(),
    };

    const result = await remoteSearchBy(mockClient as any, 'pr', 'owner', 'repo', '2023-01-01', mockLogger as any);

    expect(mockClient.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: 'repo:owner/repo+type:pr+merged:>2023-01-01',
      advanced_search: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(456);
  });
});

describe('getReleaseUrlFallback', () => {
  it('should generate release URL without tag', () => {
    const url = getReleaseUrlFallback('github.com', 'owner/repo');
    expect(url).toBe('https://github.com/owner/repo/releases');
  });

  it('should generate release URL with tag', () => {
    const url = getReleaseUrlFallback('github.com', 'owner/repo', 'v1.0.0');
    expect(url).toBe('https://github.com/owner/repo/releases/tag/v1.0.0');
  });
});

describe('commentResolvedItems', () => {
  const createMockDependencies = () => {
    const mockLogger = {
      verbose: vi.fn(),
      info: vi.fn(),
      silly: vi.fn(),
    } as unknown as Logger;

    const mockClient = {
      search: {
        issuesAndPullRequests: vi.fn(),
      },
      issues: {
        createComment: vi.fn().mockResolvedValue({}),
      },
      repos: {
        createRelease: vi.fn().mockResolvedValue({}),
      },
    };

    const mockOptions = {
      client: mockClient as OctokitClientOutput,
      commentFilterKeywords: ['fix', 'feat', 'perf'],
      gitRemote: 'https://github.com/owner/repo.git',
      execOpts: {
        cwd: process.cwd(),
      },
      dryRun: false,
      independent: false,
      logger: mockLogger,
      version: '1.2.3',
      tag: 'v1.2.3',
      templates: {
        issue: 'Issue comment template: %s',
        pullRequest: 'PR comment template: %s',
      },
    } as CommentResolvedOptions;

    return { mockLogger, mockClient, mockOptions };
  };

  it('should create comments for issues and PRs when not in dry run mode', async () => {
    const { mockClient, mockOptions } = createMockDependencies();

    // Mock search results for both issues and PRs
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for issues
        data: {
          items: [{ number: 123, title: 'Linked issue', pull_request: {} }],
        },
      })
      .mockResolvedValueOnce({
        // Second call for PRs
        data: {
          items: [{ number: 456, title: 'feature: test PR' }],
        },
      });

    await commentResolvedItems(mockOptions);

    // Verify comment creation
    expect(mockClient.issues.createComment).toHaveBeenCalledTimes(2);
  });

  it('should not create comments in dry run mode', async () => {
    const { mockLogger, mockClient, mockOptions } = createMockDependencies();

    // Setup mock search results
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for issues
        data: {
          items: [{ number: 123, title: 'Linked issue', pull_request: {} }],
        },
      })
      .mockResolvedValueOnce({
        // Second call for PRs
        data: {
          items: [{ number: 456, title: 'Another issue', pull_request: {} }],
        },
      });

    // Override dryRun to true
    mockOptions.dryRun = true;

    // Mock parseGitRepo
    vi.mock('@lerna-lite/version', () => ({
      parseGitRepo: vi.fn().mockReturnValue({
        owner: 'owner',
        name: 'repo',
        host: 'github.com',
      }),
    }));

    await commentResolvedItems(mockOptions);

    // Verify no comment creation
    expect(mockClient.issues.createComment).not.toHaveBeenCalled();

    // Verify logging for dry run
    expect(mockLogger.info).toHaveBeenCalledWith('comments', expect.stringContaining('● Commented on issue'));
  });

  it('should filter PRs based on PR title keywords', async () => {
    const { mockClient, mockOptions } = createMockDependencies();

    // Mock search to return multiple PRs with different titles
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        data: { items: [] },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            { number: 101, title: 'feature: add new functionality', pull_request: {} },
            { number: 102, title: 'fix: some bug', pull_request: {} },
            { number: 103, title: 'feature: improve performance', pull_request: {} },
          ],
        },
      });

    // Set filter keywords to only include PRs starting with 'feature'
    mockOptions.commentFilterKeywords = ['feature'];

    // Reset mock call counts
    mockClient.issues.createComment.mockClear();

    await commentResolvedItems(mockOptions);

    // Verify only PRs starting with 'feature' were processed
    expect(mockClient.issues.createComment).toHaveBeenCalledTimes(2);

    // Verify the comments were created for the correct PR numbers
    const calledWithNumbers = mockClient.issues.createComment.mock.calls.map((call) => call[0].issue_number);
    expect(calledWithNumbers).toEqual([101, 103]);
  });

  it('should filter PRs and add to issues when PR title includes "fix #[number]"', async () => {
    const { mockClient, mockOptions } = createMockDependencies();

    // Mock search to return multiple PRs with different titles
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        data: { items: [] },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            { number: 101, title: 'feat: add new functionality', pull_request: {} },
            { number: 102, title: 'fix: some bug, fix #123', pull_request: {} },
            { number: 103, title: 'feat: improve performance', pull_request: {} },
          ],
        },
      });

    // Reset mock call counts
    mockClient.issues.createComment.mockClear();

    await commentResolvedItems(mockOptions);

    // Verify the comments were created for the correct PR numbers
    const calledWithNumbers = mockClient.issues.createComment.mock.calls.map((call) => call[0].issue_number);
    expect(calledWithNumbers).toEqual([123, 101, 102, 103]);
  });
});
