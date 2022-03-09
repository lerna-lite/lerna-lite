import { FetchConfig, PackageGraph, PackageGraphNode } from '@lerna-lite/core';
import log from 'npmlog';
import pMap from 'p-map';
import pacote from 'pacote';

/**
 * Retrieve a list of graph nodes for packages that need to be published.
 * @param {import("@lerna/package-graph").PackageGraph} packageGraph
 * @param {import("./fetch-config").FetchConfig} opts
 * @returns {Promise<import("@lerna/package-graph").PackageGraphNode[]>}
 */
export function getUnpublishedPackages(packageGraph: PackageGraph, opts: FetchConfig): Promise<PackageGraphNode> {
  log.silly('getUnpublishedPackages', '');

  let chain: Promise<any> = Promise.resolve();

  // don't bother attempting to get the packument for private packages
  // @ts-ignore
  const graphNodesToCheck = Array.from(packageGraph.values()).filter(({ pkg }) => !pkg.private);

  const mapper = (pkg) =>
    pacote.packument(pkg?.name ?? '', opts).then(
      (packument) => {
        if (packument.versions === undefined || packument.versions[pkg.version] === undefined) {
          return pkg;
        }
      },
      () => {
        log.warn('', 'Unable to determine published version, assuming %j unpublished.', pkg.name);
        return pkg;
      }
    );

  chain = chain.then(() => pMap(graphNodesToCheck, mapper, { concurrency: 4 }));

  return chain.then((results) => results.filter(Boolean));
}
