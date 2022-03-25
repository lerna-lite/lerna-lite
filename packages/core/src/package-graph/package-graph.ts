import npa from 'npm-package-arg';

import { CyclicPackageGraphNode, PackageGraphNode, reportCycles } from './lib';
import { Package } from '../package';
import { ValidationError } from '../validation-error';

/**
 * A graph of packages in the current project.
 *
 * @extends {Map<string, PackageGraphNode>}
 */
export class PackageGraph extends Map {
  /**
   * @param {import("@lerna/package").Package[]} packages An array of Packages to build the graph out of.
   * @param {'allDependencies'|'dependencies'} [graphType]
   *    Pass "dependencies" to create a graph of only dependencies,
   *    excluding the devDependencies that would normally be included.
   * @param {boolean} [forceLocal] Force all local dependencies to be linked.
   */
  constructor(packages: Package[], graphType: 'allDependencies' | 'dependencies' = 'allDependencies', forceLocal?: boolean) {
    // @ts-ignore
    super(packages.map((pkg: Package) => [pkg?.name ?? '', new PackageGraphNode(pkg)]));

    if (packages.length !== this.size) {
      // weed out the duplicates
      const seen: Map<string, any> = new Map();

      for (const { name, location } of packages) {
        if (seen.has(name)) {
          seen.get(name).push(location);
        } else {
          seen.set(name, [location]);
        }
      }

      for (const [name, locations] of seen) {
        if (locations.length > 1) {
          throw new ValidationError(
            'ENAME',
            [`Package name "${name}" used in multiple packages:`, ...locations].join('\n\t')
          );
        }
      }
    }

    this.forEach((currentNode: PackageGraphNode, currentName: string) => {
      const graphDependencies =
        graphType === 'dependencies'
          ? Object.assign({}, currentNode.pkg.optionalDependencies, currentNode.pkg.dependencies)
          : Object.assign(
            {},
            currentNode.pkg.devDependencies,
            currentNode.pkg.optionalDependencies,
            currentNode.pkg.dependencies
          );

      Object.keys(graphDependencies).forEach((depName) => {
        const depNode = this.get(depName);
        // Yarn decided to ignore https://github.com/npm/npm/pull/15900 and implemented "link:"
        // As they apparently have no intention of being compatible, we have to do it for them.
        // @see https://github.com/yarnpkg/yarn/issues/4212
        const spec = graphDependencies[depName].replace(/^link:/, 'file:');
        const resolved = npa.resolve(depName, spec, currentNode.location);

        if (!depNode) {
          // it's an external dependency, store the resolution and bail
          return currentNode.externalDependencies.set(depName, resolved);
        }

        if (forceLocal || resolved.fetchSpec === depNode.location || depNode.satisfies(resolved)) {
          // a local file: specifier OR a matching semver
          currentNode.localDependencies.set(depName, resolved);
          depNode.localDependents.set(currentName, currentNode);
        } else {
          // non-matching semver of a local dependency
          currentNode.externalDependencies.set(depName, resolved);
        }
      });
    });
  }

  get rawPackageList() {
    return Array.from(this.values()).map((node) => node.pkg);
  }

  /**
   * Takes a list of Packages and returns a list of those same Packages with any Packages
   * they depend on. i.e if packageA depended on packageB `graph.addDependencies([packageA])`
   * would return [packageA, packageB].
   *
   * @param {import("@lerna/package").Package[]} filteredPackages The packages to include dependencies for.
   */
  addDependencies(filteredPackages: Package[]) {
    return this.extendList(filteredPackages, 'localDependencies');
  }

  /**
   * Takes a list of Packages and returns a list of those same Packages with any Packages
   * that depend on them. i.e if packageC depended on packageD `graph.addDependents([packageD])`
   * would return [packageD, packageC].
   *
   * @param {import("@lerna/package").Package[]} filteredPackages The packages to include dependents for.
   */
  addDependents(filteredPackages: Package[]) {
    return this.extendList(filteredPackages, 'localDependents');
  }

  /**
   * Extends a list of packages by traversing on a given property, which must refer to a
   * `PackageGraphNode` property that is a collection of `PackageGraphNode`s.
   * Returns input packages with any additional packages found by traversing `nodeProp`.
   *
   * @param {import("@lerna/package").Package[]} packageList The list of packages to extend
   * @param {'localDependencies'|'localDependents'} nodeProp The property on `PackageGraphNode` used to traverse
   */
  extendList(packageList: Package[], nodeProp: 'localDependencies' | 'localDependents') {
    // the current list of packages we are expanding using breadth-first-search
    const search = new Set<PackageGraphNode>(packageList.map(({ name }) => this.get(name)));

    // an intermediate list of matched PackageGraphNodes
    /** @type {PackageGraphNode[]} */
    const result: PackageGraphNode[] = [];

    search.forEach((currentNode) => {
      // anything searched for is always a result
      result.push(currentNode);

      currentNode[nodeProp].forEach((meta, depName) => {
        const depNode = this.get(depName);

        if (depNode !== currentNode && !search.has(depNode)) {
          search.add(depNode);
        }
      });
    });

    // actual Package instances, not PackageGraphNodes
    return result.map((node) => node.pkg);
  }

  /**
   * Return a tuple of cycle paths and nodes.
   *
   * @deprecated Use collapseCycles instead.
   *
   * @param {boolean} rejectCycles Whether or not to reject cycles
   * @returns {[Set<string[]>, Set<PackageGraphNode>]}
   */
  partitionCycles(rejectCycles?: boolean) {
    const cyclePaths = new Set<string[]>();
    const cycleNodes = new Set<PackageGraphNode>();

    this.forEach((currentNode: PackageGraphNode, currentName: string) => {
      const seen = new Set<PackageGraphNode>();

      const visits = (walk) => (dependentNode: PackageGraphNode, dependentName: string, siblingDependents: any) => {
        const step = walk.concat(dependentName);

        if (seen.has(dependentNode)) {
          return;
        }

        seen.add(dependentNode);

        if (dependentNode === currentNode) {
          // a direct cycle
          cycleNodes.add(currentNode);
          cyclePaths.add(step);

          return;
        }

        if (siblingDependents.has(currentName)) {
          // a transitive cycle
          const cycleDependentName = Array.from(dependentNode.localDependencies.keys()).find((key) =>
            currentNode.localDependents.has(key)
          );
          const pathToCycle = step.slice().reverse().concat(cycleDependentName);

          cycleNodes.add(dependentNode);
          cyclePaths.add(pathToCycle);
        }

        dependentNode.localDependents.forEach(visits(step));
      };

      currentNode.localDependents.forEach(visits([currentName]));
    });

    reportCycles(
      Array.from(cyclePaths, (cycle) => cycle.join(' -> ')),
      rejectCycles
    );

    return [cyclePaths, cycleNodes];
  }

  /**
   * Returns the cycles of this graph. If two cycles share some elements, they will
   * be returned as a single cycle.
   *
   * @param {boolean} rejectCycles Whether or not to reject cycles
   * @returns {Set<CyclicPackageGraphNode>}
   */
  collapseCycles(rejectCycles?: boolean) {
    const cyclePaths: string[] = [];
    const nodeToCycle = new Map<PackageGraphNode, CyclicPackageGraphNode>();
    const cycles = new Set<CyclicPackageGraphNode>();
    const alreadyVisited = new Set<PackageGraphNode>();
    const walkStack: Array<PackageGraphNode | CyclicPackageGraphNode> = [];

    function visits(baseNode, dependentNode) {
      if (nodeToCycle.has(baseNode)) {
        return;
      }

      let topLevelDependent = dependentNode;
      while (nodeToCycle.has(topLevelDependent)) {
        topLevelDependent = nodeToCycle.get(topLevelDependent);
      }

      // Otherwise the same node is checked multiple times which is very wasteful in a large repository
      if (alreadyVisited.has(topLevelDependent)) {
        return;
      }
      alreadyVisited.add(topLevelDependent);

      if (
        topLevelDependent === baseNode ||
        (topLevelDependent.isCycle && topLevelDependent.has(baseNode.name))
      ) {
        const cycle: any = new CyclicPackageGraphNode();

        walkStack.forEach((nodeInCycle: PackageGraphNode | CyclicPackageGraphNode) => {
          nodeToCycle.set(nodeInCycle as PackageGraphNode, cycle);
          cycle.insert(nodeInCycle);
          cycles.delete(nodeInCycle as CyclicPackageGraphNode);
        });

        cycles.add(cycle);
        // @ts-ignore
        cyclePaths.push(cycle.toString());

        return;
      }

      if (walkStack.indexOf(topLevelDependent) === -1) {
        // eslint-disable-next-line no-use-before-define
        visitWithStack(baseNode, topLevelDependent);
      }
    }

    function visitWithStack(baseNode, currentNode = baseNode) {
      walkStack.push(currentNode);
      currentNode.localDependents.forEach(visits.bind(null, baseNode));
      walkStack.pop();
    }

    this.forEach((currentNode) => visitWithStack(currentNode));
    cycles.forEach((collapsedNode) => visitWithStack(collapsedNode));

    reportCycles(cyclePaths, rejectCycles);

    return cycles;
  }

  /**
   * Remove cycle nodes.
   *
   * @deprecated Spread set into prune() instead.
   *
   * @param {Set<PackageGraphNode>} cycleNodes
   */
  pruneCycleNodes(cycleNodes: Set<PackageGraphNode>) {
    return this.prune(...cycleNodes);
  }

  /**
   * Remove all candidate nodes.
   * @param {PackageGraphNode[]} candidates
   */
  prune(...candidates: PackageGraphNode[]) {
    if (candidates.length === this.size) {
      return this.clear();
    }

    candidates.forEach((node) => this.remove(node));
  }

  /**
   * Delete by value (instead of key), as well as removing pointers
   * to itself in the other node's internal collections.
   * @param {PackageGraphNode} candidateNode instance to remove
   */
  remove(candidateNode: PackageGraphNode) {
    this.delete(candidateNode.name);

    this.forEach((node: PackageGraphNode) => {
      // remove incoming edges ("indegree")
      node.localDependencies.delete(candidateNode.name);

      // remove outgoing edges ("outdegree")
      node.localDependents.delete(candidateNode.name);
    });
  }
}
