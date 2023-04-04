const releases = new Map();

// keep test data isolated
afterEach(() => {
  releases.clear();
});

const client = {
  repos: {
    createRelease: vi.fn((opts) => {
      releases.set(opts.name, opts);
      return Promise.resolve();
    }),
  },
};

export const createGitLabClient = vi.fn(() => client) as vi.Mock<any, any, any> & { releases: Map<any, any> };
createGitLabClient.releases = releases;
