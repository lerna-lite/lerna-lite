import { PackageGraph } from '../package-graph/package-graph';
import { QueryGraphConfig } from '../models';
import { Package } from '../package';
import { PackageGraphNode } from '../package-graph';

/**
 * A mutable PackageGraph used to query for next available packages.
 */
export class QueryGraph {
  graph: PackageGraph;
  cycles: Set<any>;

  /**
   * Sort a list of Packages topologically.
   *
   * @param {import("@lerna/package").Package[]} packages An array of Packages to build the list out of
   * @param {QueryGraphConfig} [options]
   *
   * @returns {import("@lerna/package").Package[]} A list of Package instances in topological order
   */
  static toposort(packages: Package[], options: QueryGraphConfig) {
    const graph = new QueryGraph(packages, options);
    const result = [];

    let batch = graph.getAvailablePackages();

    while (batch.length) {
      for (const node of batch) {
        // no need to take() in synchronous loop
        // @ts-ignore
        result.push(node.pkg);
        graph.markAsDone(node);
      }

      batch = graph.getAvailablePackages();
    }

    return result;
  }

  /**
   * @param {import("@lerna/package").Package[]} packages An array of Packages to build the graph out of
   * @param {QueryGraphConfig} [options]
   */
  constructor(packages: Package[], { graphType = 'allDependencies', rejectCycles } = {} as QueryGraphConfig) {
    // Create dependency graph
    this.graph = new PackageGraph(packages, graphType);

    // Evaluate cycles
    this.cycles = this.graph.collapseCycles(rejectCycles);
  }

  _getNextLeaf() {
    return Array.from(this.graph.values()).filter((node) => node.localDependencies.size === 0);
  }

  _getNextCycle() {
    const cycle = Array.from(this.cycles).find((cycleNode) => cycleNode.localDependencies.size === 0);

    if (!cycle) {
      return [];
    }

    this.cycles.delete(cycle);

    return cycle.flatten();
  }

  getAvailablePackages(): PackageGraphNode[] {
    // Get the next leaf nodes
    const availablePackages = this._getNextLeaf();

    if (availablePackages.length > 0) {
      return availablePackages;
    }

    return this._getNextCycle();
  }

  /**
   * @param {string} name
   */
  markAsTaken(name: string) {
    this.graph.delete(name);
  }

  /**
   * @param {import("@lerna/package-graph").PackageGraphNode} candidateNode
   */
  markAsDone(candidateNode: PackageGraphNode) {
    this.graph.remove(candidateNode);

    for (const cycle of this.cycles) {
      cycle.unlink(candidateNode);
    }
  }
}
