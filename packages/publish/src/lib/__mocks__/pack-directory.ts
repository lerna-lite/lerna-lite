import { afterEach, vi, type Mock } from 'vitest';

const registry = new Set();

const mockPackDirectory = vi.fn((pkg) => {
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

export const packDirectory = mockPackDirectory as Mock & { registry: Set<unknown> };
packDirectory.registry = registry;
