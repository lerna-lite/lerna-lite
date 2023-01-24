jest.mock('../../git-clients', () => ({
  ...(jest.requireActual('../../git-clients') as any),
  createGitHubClient: jest.requireActual('../../__mocks__/github-client').createGitHubClient,
  parseGitRepo: jest.requireActual('../../__mocks__/github-client').parseGitRepo,
}));

import { getGithubCommits } from '../get-github-commits';

const execOpts = { cwd: '/test' };

describe('getGithubCommits method', () => {
  it('should return 2 commits from the GitHub Graphql API', async () => {
    const output = await getGithubCommits('durable', 'main', '2022-07-01T00:01:02-04:00', execOpts);

    expect(output).toHaveLength(2);
    expect(output).toEqual([
      {
        authorName: 'Tester McPerson',
        login: 'tester-mcperson',
        message: 'fix(stuff): changed something',
        shortHash: 'deadbee',
      },
      {
        authorName: 'Tester McPerson',
        login: 'tester-mcperson',
        message: 'chore(thing): updated some small stuff',
        shortHash: 'bee1234',
      },
    ]);
  });
});
