import { PackageGraphNode } from '../../../package-graph/lib/package-graph-node';
import { collectDependents } from './collect-dependents';

interface PackageCollectorOptions {
  isCandidate?: (node: PackageGraphNode, name: string) => boolean;
  onInclude?: (name: string) => void;
  excludeDependents?: boolean;
}

/**
 * Build a list of graph nodes, possibly including dependents, using predicate if available.
 * @param {Map<string, import("@lerna/package-graph").PackageGraphNode>} packages
 * @param {PackageCollectorOptions} options
 */
export function collectPackages(packages, { isCandidate = () => true, onInclude, excludeDependents } = {} as PackageCollectorOptions) {
  /** @type {Set<import("@lerna/package-graph").PackageGraphNode>} */
  const candidates = new Set();

  packages.forEach((node, name) => {
    if (isCandidate(node, name)) {
      candidates.add(node);
    }
  });

  if (!excludeDependents) {
    collectDependents(candidates).forEach((node) => candidates.add(node));
  }

  // The result should always be in the same order as the input
  const updates: PackageGraphNode[] = [];

  packages.forEach((node, name) => {
    if (candidates.has(node)) {
      if (onInclude) {
        onInclude(name);
      }
      updates.push(node);
    }
  });

  return updates;
}
