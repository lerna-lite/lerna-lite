import { type Mock, vi } from 'vitest';

import { type Package } from '../../src/package';

const mockRunLifecycle = vi.fn((pkg) => Promise.resolve(pkg));
const mockCreateRunner = vi.fn((opts) => (pkg: Package, stage: string) => {
  // no longer the actual API, but approximates inner logic of default export
  if (pkg.scripts[stage]) {
    return (mockRunLifecycle as any)(pkg, stage, opts);
  }

  return Promise.resolve();
});

function getOrderedCalls() {
  return (mockRunLifecycle as any).mock.calls.map(([pkg, script]: [Package, string]) => [pkg.name, script]);
}

export const createRunner = mockCreateRunner;
export const runLifecycle = mockRunLifecycle as Mock & { getOrderedCalls: () => any };
runLifecycle.getOrderedCalls = getOrderedCalls;
