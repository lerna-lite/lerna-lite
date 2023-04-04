const registry = new Map();

// by default, act like a spy that populates registry
const mockNpmPublish = vi.fn((pkg, tarData, opts) => {
  registry.set(pkg.name, opts.tag);

  return Promise.resolve();
});

// a convenient format for assertions
function order() {
  return Array.from(registry.keys());
}

// keep test data isolated
afterEach(() => {
  registry.clear();
});

export const npmPublish = mockNpmPublish as vi.Mock<Promise<void>, [pkg: any, tarData: any, opts: any]> & {
  order: () => any[];
  registry: Map<any, any>;
};
npmPublish.order = order;
npmPublish.registry = registry;
