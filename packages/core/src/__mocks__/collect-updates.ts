// import { collectPackages } from './lib/collect-packages.js';
// import { collectPackages, getPackagesForOption } from '../utils/collect-updates/lib/index.js';
// import { getPackagesForOption } from './lib/get-packages-for-option.js';
// import { collectPackages, getPackagesForOption } from '../utils/collect-updates/collect-updates';

// collectUpdates.setUpdated(cwd, packageNames...)
// otherwise, enables everything
const updated = new Map();

export const collectUpdates: any = vi.fn((filteredPackages, packageGraph, { cwd }) => {
  const targets = updated.get(cwd);
  const updates = targets ? new Map(targets.map((name) => [name, packageGraph.get(name)])) : packageGraph;

  return Array.from(updates.values());
});

const setUpdated = (cwd, ...names) => updated.set(cwd, names);

// isolate tests
afterEach(() => {
  updated.clear();
});

collectUpdates.setUpdated = setUpdated;

// export const collectUpdates = { ...mockCollectUpdates, setUpdated };
// export { collectUpdates2 as collectUpdates };
// module.exports.collectUpdates = mockCollectUpdates;
// module.exports.collectUpdates.setUpdated = setUpdated;
// module.exports.collectPackages = collectPackages;
// module.exports.getPackagesForOption = getPackagesForOption;

// export const collectUpdates = mockCollectUpdates;
// collectUpdates.setUpdated = setUpdated;
// export { collectPackages, getPackagesForOption };
