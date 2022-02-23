import log from 'npmlog';
import { ExecOpts, UpdateCollectorOptions } from '../../models';
import { Package } from '../../package';
import { PackageGraph } from '../../package-graph';

import { describeRefSync } from '../describe-ref';
import { collectPackages } from './lib/collect-packages';
import { getPackagesForOption } from './lib/get-packages-for-option';
import { hasTags } from './lib/has-tags';
import { makeDiffPredicate } from './lib/make-diff-predicate';

/**
 * Create a list of graph nodes representing packages changed since the previous release, tagged or otherwise.
 * @param {import("@lerna/package").Package[]} filteredPackages
 * @param {import("@lerna/package-graph").PackageGraph} packageGraph
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @param {UpdateCollectorOptions} commandOptions
 */
export function collectUpdates(filteredPackages: Package[], packageGraph: PackageGraph, execOpts: ExecOpts, commandOptions: UpdateCollectorOptions, gitDryRun = false) {
  const { forcePublish, conventionalCommits, conventionalGraduate, excludeDependents } = commandOptions;

  // If --conventional-commits and --conventional-graduate are both set, ignore --force-publish
  const useConventionalGraduate = conventionalCommits && conventionalGraduate;
  const forced = getPackagesForOption(useConventionalGraduate ? conventionalGraduate : forcePublish as boolean | string[]);

  const packages =
    filteredPackages.length === packageGraph.size
      ? packageGraph
      : new Map(filteredPackages.map(({ name }) => [name, packageGraph.get(name)]));

  let committish = commandOptions.since;

  if (hasTags(execOpts)) {
    // describe the last annotated tag in the current branch
    const { sha, refCount, lastTagName } = describeRefSync(execOpts, commandOptions.includeMergedTags, gitDryRun);
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

  const hasDiff = makeDiffPredicate(committish as string, execOpts, commandOptions.ignoreChanges as string[]);
  const needsBump =
    !commandOptions.bump || commandOptions.bump.startsWith('pre')
      ? () => false
      : /* skip packages that have not been previously prereleased */
      (node) => node.prereleaseId;
  const isForced = (node, name) =>
    (forced.has('*') || forced.has(name)) && (useConventionalGraduate ? node.prereleaseId : true);

  return collectPackages(packages, {
    isCandidate: (node, name) => isForced(node, name) || needsBump(node) || hasDiff(node),
    onInclude: (name) => log.verbose('updated', name),
    excludeDependents,
  });
}
