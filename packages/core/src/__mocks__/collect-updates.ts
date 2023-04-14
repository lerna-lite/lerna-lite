import { afterEach, vi } from 'vitest';

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
