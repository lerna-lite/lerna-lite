import 'jest-extended';
const { getPackages } = require("@lerna-lite/core");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

import { CyclicPackageGraphNode } from '../package-graph/lib/cyclic-package-graph-node';
import { PackageGraphNode } from '../package-graph';

describe('CyclicPackageGraphNode class', () => {
  it('should return the Cyclic Package Graph Node name to be cycle 1', async () => {
    const cwd = await initFixture("cycle-parent");
    const packages = await getPackages(cwd);
    const pkgCyclic = new CyclicPackageGraphNode();

    for (const pkg of packages) {
      pkgCyclic.insert(new PackageGraphNode(pkg));
    }

    expect(pkgCyclic.name).toBe('(cycle) 1');
    expect(pkgCyclic.isCycle).toBeTruthy();
    expect(Array.from(pkgCyclic.localDependents).length).toBe(0);
    expect(Array.from(pkgCyclic.localDependencies).length).toBe(0);
    expect(pkgCyclic.toString()).toBe('a -> d -> c -> b -> a');
  });

  it('should return the Cyclic Package Graph Node name to be cycle 2', async () => {
    const cwd = await initFixture("cycle-parent");
    const packages = await getPackages(cwd);
    const pkgCyclic = new CyclicPackageGraphNode();

    for (const pkg of packages) {
      pkgCyclic.insert(new PackageGraphNode(pkg));
    }

    expect(pkgCyclic.name).toBe('(cycle) 2');
    expect(Array.from(pkgCyclic.localDependents).length).toBe(0);
    expect(Array.from(pkgCyclic.localDependencies).length).toBe(0);
    expect(pkgCyclic.flatten()).toEqual([
      { 'externalDependencies': new Map(), 'localDependencies': new Map(), 'localDependents': new Map(), 'name': 'a' },
      { 'externalDependencies': new Map(), 'localDependencies': new Map(), 'localDependents': new Map(), 'name': 'b' },
      { 'externalDependencies': new Map(), 'localDependencies': new Map(), 'localDependents': new Map(), 'name': 'c' },
      { 'externalDependencies': new Map(), 'localDependencies': new Map(), 'localDependents': new Map(), 'name': 'd' },
    ]);
  });

  it('should add localDependents to one of the package and expect the Cyclic Package Graph Node to include 1 localDependents in its array', async () => {
    const cwd = await initFixture("cycle-parent");
    const packages = await getPackages(cwd);
    const pkgCyclic = new CyclicPackageGraphNode();

    for (const pkg of packages) {
      const pkgNode = new PackageGraphNode(pkg);
      if (pkgNode.name === 'c') {
        pkgNode.localDependents.set('f', pkg);
      }
      pkgCyclic.insert(pkgNode);
    }

    expect(pkgCyclic.name).toBe('(cycle) 3');
    expect(Array.from(pkgCyclic.localDependents).length).toBe(1);
    expect(pkgCyclic.toString()).toBe('a -> d -> c -> b -> a');
    expect(pkgCyclic.contains('a')).toBeTruthy();
  });

  it('should add localDependents to one of the package and expect the Cyclic Package Graph Node to include 1 localDependents in its array', async () => {
    const cwd = await initFixture("cycle-parent");
    const packages = await getPackages(cwd);
    const pkgCyclic = new CyclicPackageGraphNode();

    for (const pkg of packages) {
      const pkgNode = new PackageGraphNode(pkg);
      if (pkgNode.name === 'd') {
        pkgNode.localDependencies.set('g', pkg);
        pkgNode.localDependencies.set('h', pkg);
      }
      pkgCyclic.insert(pkgNode);
    }

    expect(pkgCyclic.name).toBe('(cycle) 4');
    expect(Array.from(pkgCyclic.localDependencies).length).toBe(2);
    expect(pkgCyclic.toString()).toBe('a -> d -> c -> b -> a');
    expect(pkgCyclic.contains('a')).toBeTruthy();
  });
});