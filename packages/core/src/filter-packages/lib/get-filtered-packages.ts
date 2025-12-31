import { log } from '@lerna-lite/npmlog';

import type { ExecOpts } from '../../models/interfaces.js';
import type { PackageGraph } from '../../package-graph/package-graph.js';
import type { Package } from '../../package.js';
import { collectUpdates } from '../../utils/collect-updates/collect-updates.js';
import { filterPackages } from './filter-packages.js';
import type { FilterOptions } from './interfaces.js';

/**
 * Retrieve a list of Package instances filtered by various options.
 * @param {import('@lerna/package-graph').PackageGraph} packageGraph
 * @param {import('@lerna/child-process').ExecOpts} execOpts
 * @param {Partial<FilterOptions>} opts
 * @returns {Promise<import('@lerna/package').Package[]>}
 */
export async function getFilteredPackages(
  packageGraph: PackageGraph,
  execOpts: ExecOpts,
  opts: FilterOptions
): Promise<Package[]> {
  // @ts-ignore
  const options: FilterOptions = { log, ...opts };

  if (options.scope) {
    options.log.notice('filter', 'including %j', options.scope);
  }

  if (options.ignore) {
    options.log.notice('filter', 'excluding %j', options.ignore);
  }

  let chain: Promise<any> = Promise.resolve();

  chain = chain.then(() =>
    filterPackages(packageGraph.rawPackageList, options.scope, options.ignore, options.private, options.continueIfNoMatch)
  );

  if (options.since !== undefined) {
    options.log.notice('filter', 'changed since %j', options.since);

    if (options.excludeDependents) {
      options.log.notice('filter', 'excluding dependents');
    }

    if (options.includeMergedTags) {
      options.log.notice('filter', 'including merged tags');
    }

    chain = chain.then((filteredPackages: Package[]) =>
      Promise.resolve(collectUpdates(filteredPackages, packageGraph, execOpts, opts)).then((updates) => {
        const updated = new Set(updates.map(({ pkg }) => pkg.name));

        return filteredPackages.filter((pkg) => updated.has(pkg.name));
      })
    );
  }

  if (options.includeDependents) {
    options.log.notice('filter', 'including dependents');

    chain = chain.then((filteredPackages) => packageGraph.addDependents(filteredPackages));
  }

  if (options.includeDependencies) {
    options.log.notice('filter', 'including dependencies');

    chain = chain.then((filteredPackages) => packageGraph.addDependencies(filteredPackages));
  }

  return chain;
}
