import { log } from '@lerna-lite/npmlog';
import { describe, expect, it, vi } from 'vitest';
import { getGithubCommits } from '../get-github-commits.js';

vi.mock('../../git-clients/github-client', async () => ({
  ...(await vi.importActual<any>('../../git-clients/github-client')),
  createGitHubClient: (await vi.importActual<any>('../../__mocks__/github-client')).createGitHubClient,
  parseGitRepo: (await vi.importActual<any>('../../__mocks__/github-client')).parseGitRepo,
}));

const execOpts = { cwd: '/test' };

describe('getGithubCommits method', () => {
  it('logs a warning and returns an empty array of changes when git tag "since" date is undefined', async () => {
    const logSpy = vi.spyOn(log, 'warn');
    const output = await getGithubCommits('durable', 'main', undefined as any, execOpts);

    expect(output).toHaveLength(0);
    expect(logSpy).toHaveBeenCalledWith(
      'github',
      'invalid "since" date provided to `getGithubCommits()` which is however required to properly fetch all GitHub commits info since the last release.'
    );
  });

  it('logs a warning and returns an empty array of changes when git tag "since" date is empty', async () => {
    const logSpy = vi.spyOn(log, 'warn');
    const output = await getGithubCommits('durable', 'main', '', execOpts);

    expect(output).toHaveLength(0);
    expect(logSpy).toHaveBeenCalledWith(
      'github',
      'invalid "since" date provided to `getGithubCommits()` which is however required to properly fetch all GitHub commits info since the last release.'
    );
  });

  it('should return 2 commits from the GitHub Graphql API', async () => {
    const output = await getGithubCommits('durable', 'main', '2022-07-01T00:01:02-04:00', execOpts);

    expect(output).toHaveLength(2);
    expect(output).toEqual([
      {
        authorName: 'Tester McPerson',
        login: 'tester-mcperson',
        message: 'fix(stuff): changed something',
        hash: 'deadbeef123456789',
        shortHash: 'deadbee',
      },
      {
        authorName: 'Tester McPerson',
        login: 'tester-mcperson',
        message: 'chore(thing): updated some small stuff',
        hash: 'bee1234beef7890abc',
        shortHash: 'bee1234',
      },
    ]);
  });
});
