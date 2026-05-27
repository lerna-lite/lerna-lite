import type { TopologicalConfig } from '../models/interfaces.js';
import type { PackageGraphNode } from '../package-graph/lib/package-graph-node.js';
import type { Package } from '../package.js';
import { QueryGraph } from './query-graph.js';

/** Native concurrent queue replacing p-queue. */
class ConcurrentQueue {
  private readonly concurrency: number;
  private running = 0;
  private readonly pending: Array<() => void> = [];
  private readonly idleResolvers: Array<() => void> = [];

  constructor(concurrency = Infinity) {
    this.concurrency = concurrency;
  }

  add(fn: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const run = () => {
        this.running++;
        fn()
          .then(resolve, reject)
          .finally(() => {
            this.running--;
            if (this.pending.length > 0) {
              this.pending.shift()!();
            } else if (this.running === 0) {
              const resolvers = this.idleResolvers.splice(0);
              for (const r of resolvers) r();
            }
          });
      };

      if (this.running < this.concurrency) {
        run();
      } else {
        this.pending.push(run);
      }
    });
  }

  onIdle(): Promise<void> {
    if (this.running === 0 && this.pending.length === 0) {
      /* v8 ignore next */
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.idleResolvers.push(resolve);
    });
  }
}

/**
 * Run callback in maximally-saturated topological order.
 *
 * @template T
 * @param {import("@lerna/package").Package[]} packages List of `Package` instances
 * @param {(pkg: import("@lerna/package").Package) => Promise<T>} runner Callback to map each `Package` with
 * @param {TopologicalConfig} [options]
 * @returns {Promise<T[]>} when all executions complete
 */
export function runTopologically<T = any>(
  packages: Package[],
  runner: (pkg: Package) => Promise<T>,
  { concurrency, graphType, rejectCycles, npmClient = 'npm' } = {} as TopologicalConfig
) {
  const queue = new ConcurrentQueue(concurrency);
  const graph = new QueryGraph(packages, { graphType, rejectCycles, npmClient });

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
