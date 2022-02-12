import path from 'path';
import log from 'npmlog';
import { exec } from '@lerna-lite/core';

/**
 * Retrieve a list of graph nodes for packages that were tagged in a non-independent release.
 * @param {import("@lerna/package-graph").PackageGraph} packageGraph
 * @param {string} rootPath
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @returns {Promise<import("@lerna/package-graph").PackageGraphNode[]>}
 */
export function getTaggedPackages(packageGraph, rootPath, execOpts, gitDryRun = false) {
  log.silly('getTaggedPackages', '');

  // @see https://stackoverflow.com/a/424142/5707
  // FIXME: --root is only necessary for tests :P
  return exec('git', ['diff-tree', '--name-only', '--no-commit-id', '--root', '-r', '-c', 'HEAD'], execOpts, gitDryRun)
    .then(({ stdout }) => {
      const manifests = stdout.split('\n').filter((fp) => path.basename(fp) === 'package.json');
      const locations = new Set<string>(manifests.map((fp) => path.join(rootPath, path.dirname(fp))));

      // @ts-ignore
      return Array.from(packageGraph.values()).filter((node: { location: string }) => locations.has(node.location));
    });
}
