import { afterEach, vi } from 'vitest';

// collectUpdates.setUpdated(cwd, packageNames...)
// otherwise, enables everything
const updated = new Map();

export const collectUpdates: any = vi.fn((filteredPackages, packageGraph, { cwd }) => {
  const targets = updated.get(cwd);
  const updates = targets ? new Map(targets.map((name: string) => [name, packageGraph.get(name)])) : packageGraph;

  return Array.from(updates.values());
});

const setUpdated = (cwd: string, ...names: string[]) => updated.set(cwd, names);

// isolate tests
afterEach(() => {
  updated.clear();
});

collectUpdates.setUpdated = setUpdated;
