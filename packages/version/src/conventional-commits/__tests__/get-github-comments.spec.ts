vi.mock('../../git-clients', async () => ({
  ...(await vi.importActual<any>('../../git-clients')),
  createGitHubClient: (await vi.importActual<any>('../../__mocks__/github-client')).createGitHubClient,
  parseGitRepo: (await vi.importActual<any>('../../__mocks__/github-client')).parseGitRepo,
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
