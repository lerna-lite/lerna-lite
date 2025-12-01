import { log } from '@lerna-lite/npmlog';

import type { DescribeRefOptions, ExecOpts, UpdateCollectorOptions } from '../../models/interfaces.js';
import type { PackageGraph } from '../../package-graph/package-graph.js';
import type { Package } from '../../package.js';
import { describeRefSync } from '../describe-ref.js';
import { collectPackages } from './lib/collect-packages.js';
import { getPackagesForOption } from './lib/get-packages-for-option.js';
import { hasTags } from './lib/has-tags.js';
import { diffWorkspaceCatalog, makeDiffPredicate } from './lib/make-diff-predicate.js';

/**
 * Create a list of graph nodes representing packages changed since the previous release, tagged or otherwise.
 * @param {import("@lerna/package").Package[]} filteredPackages
 * @param {import("@lerna/package-graph").PackageGraph} packageGraph
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @param {UpdateCollectorOptions} commandOptions
 */
export function collectUpdates(
  filteredPackages: Package[],
  packageGraph: PackageGraph,
  execOpts: ExecOpts,
  commandOptions: UpdateCollectorOptions
) {
  const {
    forcePublish,
    forceConventionalGraduate,
    conventionalCommits,
    conventionalGraduate,
    excludeDependents,
    independentSubpackages,
    isIndependent,
    describeTag,
    tagVersionSeparator,
  } = commandOptions;

  // If --conventional-commits and --conventional-graduate are both set, ignore --force-publish but consider --force-conventional-graduate
  const useConventionalGraduate = conventionalCommits && (conventionalGraduate || forceConventionalGraduate);
  const forced = getPackagesForOption(useConventionalGraduate ? conventionalGraduate : (forcePublish as boolean | string[]));

  const packages =
    filteredPackages.length === packageGraph.size
      ? packageGraph
      : new Map(filteredPackages.map(({ name }) => [name, packageGraph.get(name)]));

  let committish = commandOptions.since;
  const tagPattern = describeTag ? describeTag : isIndependent ? '*@*' : 'v*';

  let prevTag = '';
  if (hasTags(execOpts, tagPattern)) {
    const describeOptions: DescribeRefOptions = {
      ...execOpts,
      match: tagPattern,
      separator: tagVersionSeparator,
    };

    // describe the last annotated tag in the current branch
    const { sha, refCount, lastTagName } = describeRefSync(describeOptions, commandOptions.includeMergedTags);
    prevTag = lastTagName || '';
    // TODO: warn about dirty tree?

    if (refCount === '0' && forced.size === 0 && !committish) {
      // no commits since previous release
      log.notice('', 'Current HEAD is already released, skipping change detection.');

      return [];
    }

    if (commandOptions.canary) {
      // if it's a merge commit, it will return all the commits that were part of the merge
      // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
      committish = `${sha}^..${sha}`;
    } else if (!committish) {
      // if no tags found, this will be undefined and we'll use the initial commit
      committish = lastTagName;
    }
  }

  if (forced.size) {
    // "warn" might seem a bit loud, but it is appropriate for logging anything _forced_
    log.warn(
      useConventionalGraduate ? 'conventional-graduate' : 'force-publish',
      forced.has('*') ? 'all packages' : Array.from(forced.values()).join('\n')
    );
  }

  if (useConventionalGraduate) {
    // --conventional-commits --conventional-graduate
    if (forced.has('*')) {
      log.info('', 'Graduating all prereleased packages');
    } else {
      log.info('', 'Graduating prereleased packages');
    }
  } else if (!committish || forced.has('*')) {
    // --force-publish or no tag
    log.info('', 'Assuming all packages changed');

    return collectPackages(packages, {
      onInclude: (name) => log.verbose('updated', name),
      excludeDependents,
    });
  }

  log.info('', `Looking for changed packages since ${committish}`);

  const changedCatalogDeps: string[] = [];
  if (prevTag && packageGraph.hasWorkspaceCatalog) {
    changedCatalogDeps.push(...diffWorkspaceCatalog(prevTag, packageGraph.npmClient));
  }

  const hasDiff = makeDiffPredicate(
    committish as string,
    execOpts,
    commandOptions.ignoreChanges as string[],
    changedCatalogDeps,
    {
      independentSubpackages,
    }
  );
  const needsBump =
    !commandOptions.bump || commandOptions.bump.startsWith('pre')
      ? () => false
      : /* skip packages that have not been previously prereleased */
        (node) => node.prereleaseId;
  const isForced = (node, name) =>
    (forced.has('*') || forced.has(name)) && ((useConventionalGraduate ? node.prereleaseId : true) || forceConventionalGraduate);

  return collectPackages(packages, {
    isCandidate: (node, name) => isForced(node, name) || needsBump(node) || hasDiff(node),
    onInclude: (name) => log.verbose('updated', name),
    excludeDependents,
  });
}
