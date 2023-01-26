const registry = new Set();

const mockPackDirectory = jest.fn((pkg) => {
  registry.add(pkg.name);

  return Promise.resolve({
    filename: `${pkg.name}-MOCKED.tgz`,
    tarFilePath: `/TEMP_DIR/${pkg.name}-MOCKED.tgz`,
  });
});

// keep test data isolated
afterEach(() => {
  registry.clear();
});

export const packDirectory = mockPackDirectory as jest.Mock<any, any, any> & { registry: Set<unknown> };
packDirectory.registry = registry;
