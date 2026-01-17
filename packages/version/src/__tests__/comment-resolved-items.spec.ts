import { type Logger } from '@lerna-lite/npmlog';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CommentResolvedOptions, OctokitClientOutput } from '../interfaces.js';
import { commentResolvedItems, remoteSearchBy, getReleaseUrlFallback } from '../lib/comment-resolved-items.js';
import { RateLimiter } from '../lib/rate-limiter.js';

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
      info: vi.fn(),
      silly: vi.fn(),
      verbose: vi.fn(),
    };

    const result = await remoteSearchBy(mockClient as any, 'linked_issue', 'owner', 'repo', '2023-01-01', [], mockLogger as any);

    expect(mockClient.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: 'repo:owner/repo+is:issue+linked:pr+closed:>2023-01-01',
      per_page: 100,
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
      info: vi.fn(),
      silly: vi.fn(),
      verbose: vi.fn(),
    };

    const result = await remoteSearchBy(mockClient as any, 'pr', 'owner', 'repo', '2023-01-01', [], mockLogger as any);

    expect(mockClient.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: 'repo:owner/repo+type:pr+merged:>2023-01-01',
      per_page: 100,
    });
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe(456);
  });

  it('should construct query for pull requests with filter keywords', async () => {
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
      info: vi.fn(),
      silly: vi.fn(),
      verbose: vi.fn(),
    };

    const result = await remoteSearchBy(
      mockClient as any,
      'pr',
      'owner',
      'repo',
      '2023-01-01',
      ['fix', 'feat'],
      mockLogger as any
    );

    expect(mockClient.search.issuesAndPullRequests).toHaveBeenCalledWith({
      q: 'repo:owner/repo+fix+OR+feat+in:title+type:pr+merged:>2023-01-01',
      per_page: 100,
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
      info: vi.fn(),
      silly: vi.fn(),
      verbose: vi.fn(),
      warn: vi.fn(),
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
      currentBranch: 'main',
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

  // Mock RateLimiter to avoid actual throttling during tests
  beforeEach(() => {
    vi.spyOn(RateLimiter.prototype, 'throttle').mockImplementation(async (fn) => fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create comments for issues and PRs when not in dry run mode', async () => {
    const { mockLogger, mockClient, mockOptions } = createMockDependencies();

    // Mock search results: PRs first, then issues
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs
        data: {
          items: [{ number: 456, title: 'feature: test PR that fixes #123' }],
        },
      })
      .mockResolvedValueOnce({
        // Second call for linked issues
        data: {
          items: [{ number: 123, title: 'Linked issue' }],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 123, title: 'Linked issue' },
            { number: 333, title: 'unlinked issue' },
          ],
        },
      });

    const results = await commentResolvedItems(mockOptions);

    // Verify comment creation
    expect(mockClient.issues.createComment).toHaveBeenCalledTimes(2);

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith('comments', expect.stringContaining('● Commented on'));

    // Verify results
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should handle comment creation failures', async () => {
    const { mockLogger, mockClient, mockOptions } = createMockDependencies();

    // Mock a failed comment creation
    mockClient.issues.createComment.mockRejectedValueOnce(new Error('API Error'));

    // Mock search results: PRs first, then issues
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        data: {
          items: [{ number: 456, title: 'feature: test PR that fixes #123' }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ number: 123, title: 'Linked issue' }],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 123, title: 'Linked issue' },
            { number: 333, title: 'unlinked issue' },
          ],
        },
      });

    const results = await commentResolvedItems(mockOptions);

    // Verify comment creation attempt
    expect(mockClient.issues.createComment).toHaveBeenCalledTimes(2);

    // Verify logging for failure
    expect(mockLogger.info).toHaveBeenCalledWith('comments', expect.stringContaining('✕ Failed to comment on'));

    // Verify results
    expect(results).toHaveLength(2);
    expect(results.some((r) => !r.success)).toBe(true);
    expect(results.filter((r) => !r.success)).toHaveLength(1);
  });

  it('should not create comments in dry run mode', async () => {
    const { mockLogger, mockClient, mockOptions } = createMockDependencies();

    // Setup mock search results: PRs first, then issues
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs
        data: {
          items: [{ number: 456, title: 'feature: test PR that fixes #123' }],
        },
      })
      .mockResolvedValueOnce({
        // Second call for issues
        data: {
          items: [{ number: 123, title: 'Linked issue' }],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 123, title: 'Linked issue' },
            { number: 333, title: 'unlinked issue' },
          ],
        },
      });

    // Override dryRun to true
    mockOptions.dryRun = true;

    await commentResolvedItems(mockOptions);

    // Verify no comment creation
    expect(mockClient.issues.createComment).not.toHaveBeenCalled();

    // Verify logging for dry run
    expect(mockLogger.info).toHaveBeenCalledWith('comments', expect.stringContaining('● Would comment on'));
  });

  it('should filter PRs based on PR title keywords', async () => {
    const { mockClient, mockOptions } = createMockDependencies();

    // Mock search to return PRs first, then no issues
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs
        data: {
          items: [
            { number: 101, title: 'feature: add new functionality' },
            { number: 102, title: 'fix: some bug' },
            { number: 103, title: 'feature: improve performance' },
            { number: 104, title: 'add some new features' },
          ],
        },
      })
      .mockResolvedValueOnce({
        // Second call for issues
        data: { items: [] },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [{ number: 333, title: 'unlinked issue' }],
        },
      });

    // Set filter keywords to only include PRs starting with 'feature'
    mockOptions.commentFilterKeywords = ['feature'];

    // Reset mock call counts
    mockClient.issues.createComment.mockClear();

    const results = await commentResolvedItems(mockOptions);

    // Verify only PRs starting with 'feature' were processed
    expect(mockClient.issues.createComment).toHaveBeenCalledTimes(2);

    // Verify the comments were created for the correct PR numbers
    const calledWithNumbers = mockClient.issues.createComment.mock.calls.map((call) => call[0].issue_number);
    expect(calledWithNumbers).toEqual([101, 103]);

    // Verify results match
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.map((r) => r.number)).toEqual([101, 103]);
  });

  it('should filter PRs and add to issues when PR title includes "fix #[number]"', async () => {
    const { mockClient, mockOptions } = createMockDependencies();

    // Mock search to return PRs first, then issues
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs
        data: {
          items: [
            { number: 101, title: 'feat: add new functionality' },
            { number: 102, title: 'fix: some bug, fix #123' },
            { number: 103, title: 'feat: improve performance' },
          ],
        },
      })
      .mockResolvedValueOnce({
        // Second call for issues
        data: {
          items: [{ number: 123, title: 'Issue that was fixed' }],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 123, title: 'Linked issue' },
            { number: 333, title: 'unlinked issue' },
          ],
        },
      });

    // Reset mock call counts
    mockClient.issues.createComment.mockClear();

    const results = await commentResolvedItems(mockOptions);

    // Verify the comments were created for the correct PR numbers
    const calledWithNumbers = mockClient.issues.createComment.mock.calls.map((call) => call[0].issue_number);
    expect(calledWithNumbers).toEqual([123, 101, 102, 103]);

    // Verify results
    expect(results).toHaveLength(4);
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.map((r) => r.number)).toEqual([123, 101, 102, 103]);
  });

  it('should add issue from PR title "fix #[number]" if not already in search results', async () => {
    const { mockClient, mockOptions } = createMockDependencies();

    // Mock search to return PRs first, then issues (issue #999 NOT in search results)
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs - includes fix #999 which is NOT in issue search
        data: {
          items: [
            { number: 101, title: 'feat: add new functionality' },
            { number: 102, title: 'fix: bug fixes #999' },
          ],
        },
      })
      .mockResolvedValueOnce({
        // Second call for issues - issue #999 is NOT returned
        data: {
          items: [],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 333, title: 'unlinked issue' },
            { number: 999, title: 'unlinked issue' }, // unlinked issue #999 but must exists and not be closed yet
          ],
        },
      });

    // Reset mock call counts
    mockClient.issues.createComment.mockClear();

    const results = await commentResolvedItems(mockOptions);

    // Verify issue #999 was added from PR title even though it wasn't in search results
    const calledWithNumbers = mockClient.issues.createComment.mock.calls.map((call) => call[0].issue_number);
    expect(calledWithNumbers).toEqual([999, 101, 102]);

    // Verify results
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should handle empty search results gracefully', async () => {
    const { mockLogger, mockClient, mockOptions } = createMockDependencies();

    // Mock empty search results for both issues and PRs
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        data: { items: [] },
      })
      .mockResolvedValueOnce({
        data: { items: [] },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [],
        },
      });

    const results = await commentResolvedItems(mockOptions);

    // Verify no comment creation
    expect(mockClient.issues.createComment).not.toHaveBeenCalled();

    // Verify results
    expect(results).toHaveLength(0);

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith('comments', 'Merged Pull Requests: ');
    expect(mockLogger.info).toHaveBeenCalledWith('comments', 'Closed linked issues: ');
  });

  it('should respect template substitution for comments', async () => {
    const { mockClient, mockOptions } = createMockDependencies();

    // Mock search results: PRs first, then issues
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs
        data: {
          items: [{ number: 456, title: 'feature: test PR that fixes #123' }],
        },
      })
      .mockResolvedValueOnce({
        // Second call for issues
        data: {
          items: [{ number: 123, title: 'Linked issue' }],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 123, title: 'Linked issue' },
            { number: 333, title: 'unlinked issue' },
          ],
        },
      });

    // Verify comment templates are used correctly
    const results = await commentResolvedItems(mockOptions);

    // Check comment creation calls
    const commentCalls = mockClient.issues.createComment.mock.calls;
    expect(commentCalls).toHaveLength(2);

    // Verify template substitution
    commentCalls.forEach((call) => {
      const commentBody = call[0].body;
      expect(commentBody).toContain('v1.2.3');
      expect(commentBody).toContain('v1.2.3');
      // expect(commentBody).toMatch(/https:\/\/github\.com\/owner\/repo\/releases\/tag\/v1\.2\.3/);
    });

    // Verify results
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should handle multiple comment templates', async () => {
    const { mockClient, mockOptions } = createMockDependencies();

    // Modify options to have different templates for issues and PRs
    mockOptions.templates = {
      issue: 'Issue specific template for %s',
      pullRequest: 'PR specific template for %s',
    };

    // Mock search results: PRs first, then issues
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs
        data: {
          items: [{ number: 456, title: 'feature: test PR that fixes #123' }],
        },
      })
      .mockResolvedValueOnce({
        // Second call for issues
        data: {
          items: [{ number: 123, title: 'Linked issue' }],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 123, title: 'Linked issue' },
            { number: 333, title: 'unlinked issue' },
          ],
        },
      });

    const results = await commentResolvedItems(mockOptions);

    // Check comment creation calls
    const commentCalls = mockClient.issues.createComment.mock.calls;
    expect(commentCalls).toHaveLength(2);

    // Verify different templates are used
    const [issueComment, prComment] = commentCalls;

    expect(issueComment[0].body).toContain('Issue specific template for v1.2.3');
    expect(prComment[0].body).toContain('PR specific template for v1.2.3');

    // Verify results
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('should prevent duplicate comments on the same issue or PR', async () => {
    const { mockLogger, mockClient, mockOptions } = createMockDependencies();

    // Mock search results with duplicate issue number
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs
        data: {
          items: [
            { number: 456, title: 'feature: test PR 1 that fixes #123' },
            { number: 456, title: 'feature: test PR 2 that fixes #123' },
          ],
        },
      })
      .mockResolvedValueOnce({
        // Second call for issues - duplicate issue
        data: {
          items: [
            { number: 123, title: 'Linked issue 1' },
            { number: 123, title: 'Linked issue 2' },
          ],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 123, title: 'Linked issue' },
            { number: 333, title: 'unlinked issue' },
          ],
        },
      });

    const results = await commentResolvedItems(mockOptions);

    // Verify comment creation happened only once for each unique number
    expect(mockClient.issues.createComment).toHaveBeenCalledTimes(2);

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith('comments', expect.stringContaining('Closed linked issues: 123'));
    expect(mockLogger.info).toHaveBeenCalledWith('comments', expect.stringContaining('Merged Pull Requests: 456'));

    // Verify results
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);

    // Verify unique numbers in results
    const uniqueNumbers = new Set(results.map((r) => r.number));
    expect(uniqueNumbers.size).toBe(2);
    expect(uniqueNumbers).toContain(123);
    expect(uniqueNumbers).toContain(456);
  });

  it('should handle mixed duplicate and unique issues/PRs', async () => {
    const { mockLogger, mockClient, mockOptions } = createMockDependencies();

    // Mock search results with mix of duplicate and unique numbers
    mockClient.search.issuesAndPullRequests
      .mockResolvedValueOnce({
        // First call for PRs - mix of numbers
        data: {
          items: [
            { number: 456, title: 'feature: test PR 1 that fixes #123' },
            { number: 457, title: 'feature: test PR 2 that fixes #124' },
            { number: 456, title: 'feature: test PR 3 that fixes #123' },
          ],
        },
      })
      .mockResolvedValueOnce({
        // Second call for issues - mix of numbers
        data: {
          items: [
            { number: 123, title: 'Linked issue 1' },
            { number: 124, title: 'Linked issue 2' },
            { number: 123, title: 'Linked issue 3' },
          ],
        },
      })
      .mockResolvedValueOnce({
        // last call for all issues
        data: {
          items: [
            { number: 123, title: 'Linked issue 1' },
            { number: 124, title: 'Linked issue 2' },
            { number: 123, title: 'Linked issue 3' },
            { number: 333, title: 'unlinked issue' },
          ],
        },
      });

    const results = await commentResolvedItems(mockOptions);

    // Verify comment creation happened only once for each unique number
    expect(mockClient.issues.createComment).toHaveBeenCalledTimes(4);

    // Verify logging
    expect(mockLogger.info).toHaveBeenCalledWith('comments', expect.stringContaining('Closed linked issues: 123, 124'));
    expect(mockLogger.info).toHaveBeenCalledWith('comments', expect.stringContaining('Merged Pull Requests: 456, 457'));

    // Verify results
    expect(results).toHaveLength(4);
    expect(results.every((r) => r.success)).toBe(true);

    // Verify unique numbers in results
    const uniqueNumbers = new Set(results.map((r) => r.number));
    expect(uniqueNumbers.size).toBe(4);
    expect(uniqueNumbers).toContain(123);
    expect(uniqueNumbers).toContain(124);
    expect(uniqueNumbers).toContain(456);
    expect(uniqueNumbers).toContain(457);

    // Verify that each unique number appears only once in the results
    const numberCounts = results.reduce((acc, result) => {
      acc[result.number] = (acc[result.number] || 0) + 1;
      return acc;
    }, {});

    Object.entries(numberCounts).forEach(([_number, count]) => {
      expect(count).toBe(1);
    });
  });
});
