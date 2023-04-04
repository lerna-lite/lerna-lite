const releases = new Map();

// keep test data isolated
afterEach(() => {
  releases.clear();
});

export const graphqlCommitNodes = [
  {
    oid: 'deadbeef123456789',
    author: {
      name: 'Tester McPerson',
      user: {
        login: 'tester-mcperson',
      },
    },
    message: 'fix(stuff): changed something',
  },
  {
    oid: 'bee1234beef7890abc',
    author: {
      name: 'Tester McPerson',
      user: {
        login: 'tester-mcperson',
      },
    },
    message: 'chore(thing): updated some small stuff',
  },
];

const client = {
  repos: {
    createRelease: vi.fn((opts) => {
      releases.set(opts.name, opts);
      return Promise.resolve();
    }),
  },
  graphql: vi.fn(() => {
    return {
      repository: {
        ref: {
          target: {
            history: {
              nodes: graphqlCommitNodes,
              pageInfo: {
                hasNextPage: false,
                endCursor: '123abc456efg789',
              },
            },
          },
        },
      },
    };
  }),
};

export const createGitHubClient: any = vi.fn(() => client);
createGitHubClient.releases = releases;

export const parseGitRepo = () => ({
  owner: 'lerna',
  name: 'lerna',
});
