const { collectPackages, getPackagesForOption } = jest.requireActual('../utils/collect-updates/collect-updates');

// collectUpdates.setUpdated(cwd, packageNames...)
// otherwise, enables everything
const updated = new Map();

const mockCollectUpdates: any = jest.fn((filteredPackages, packageGraph, { cwd }) => {
  const targets = updated.get(cwd);
  const updates = targets ? new Map(targets.map((name) => [name, packageGraph.get(name)])) : packageGraph;

  return Array.from(updates.values());
});

const setUpdated = (cwd, ...names) => updated.set(cwd, names);

// isolate tests
afterEach(() => {
  updated.clear();
});

export const collectUpdates = mockCollectUpdates;
collectUpdates.setUpdated = setUpdated;
export { collectPackages, getPackagesForOption };
