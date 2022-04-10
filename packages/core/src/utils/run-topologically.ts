import PQueue from 'p-queue';

import { QueryGraph } from './query-graph';
import { TopologicalConfig } from '../models';
import { Package } from '../package';
import { PackageGraphNode } from '../package-graph';

/**
 * Run callback in maximally-saturated topological order.
 *
 * @template T
 * @param {import("@lerna/package").Package[]} packages List of `Package` instances
 * @param {(pkg: import("@lerna/package").Package) => Promise<T>} runner Callback to map each `Package` with
 * @param {TopologicalConfig} [options]
 * @returns {Promise<T[]>} when all executions complete
 */
export function runTopologically<T = any>(packages: Package[], runner: (pkg: Package) => Promise<T>, { concurrency, graphType, rejectCycles } = {} as TopologicalConfig) {
  const queue = new PQueue({ concurrency });
  const graph = new QueryGraph(packages, { graphType, rejectCycles });

  return new Promise((resolve, reject) => {
    const returnValues: any[] = [];

    const queueNextAvailablePackages = () =>
      graph.getAvailablePackages().forEach(({ pkg, name }) => {
        graph.markAsTaken(name);

        queue
          .add(() =>
            runner(pkg)
              .then((value: any) => returnValues.push(value))
              .then(() => graph.markAsDone(pkg as unknown as PackageGraphNode))
              .then(() => queueNextAvailablePackages())
          )
          .catch(reject);
      });

    queueNextAvailablePackages();

    return queue.onIdle().then(() => resolve(returnValues));
  });
}
