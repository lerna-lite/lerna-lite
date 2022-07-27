jest.mock('../../git-clients', () => ({
  ...(jest.requireActual('../../git-clients') as any),
  createGitHubClient: jest.requireActual('../../__mocks__/github-client').createGitHubClient,
  parseGitRepo: jest.requireActual('../../__mocks__/github-client').parseGitRepo,
}));

import { getDescendantObjectProp, getGithubCommits } from '../get-github-commits';

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

describe('getDescendantObjectProp method', () => {
  let obj = {};
  beforeEach(() => {
    obj = { id: 1, user: { firstName: 'John', lastName: 'Doe', address: { number: 123, street: 'Broadway' } } };
  });

  it('should return original object when no path is provided', () => {
    const output = getDescendantObjectProp(obj, undefined);
    expect(output).toBe(obj);
  });

  it('should return undefined when search argument is not part of the input object', () => {
    const output = getDescendantObjectProp(obj, 'users');
    expect(output).toBe(undefined as any);
  });

  it('should return the object descendant even when path given is not a dot notation', () => {
    const output = getDescendantObjectProp(obj, 'user');
    expect(output).toEqual(obj['user']);
  });

  it('should return the object descendant when using dot notation', () => {
    const output = getDescendantObjectProp(obj, 'user.firstName');
    expect(output).toEqual('John');
  });

  it('should return the object descendant when using multiple levels of dot notation', () => {
    const output = getDescendantObjectProp(obj, 'user.address.street');
    expect(output).toEqual('Broadway');
  });
});
