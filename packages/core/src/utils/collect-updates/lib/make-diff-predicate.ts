import { globbySync } from 'globby';
import log from 'npmlog';
import { filter as minimatchFilter } from 'minimatch';
import { dirname, relative } from 'node:path';
import slash from 'slash';

import { execSync } from '../../../child-process.js';
import { ExecOpts } from '../../../models/index.js';

/**
 * @param {string} committish
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @param {string[]} ignorePatterns
 */
export function makeDiffPredicate(
  committish: string,
  execOpts: ExecOpts,
  ignorePatterns: string[] = [],
  diffOpts: { independentSubpackages?: boolean }
) {
  const ignoreFilters = new Set(
    ignorePatterns.map((p) =>
      minimatchFilter(`!${p}`, {
        matchBase: true,
        // dotfiles inside ignored directories should also match
        dot: true,
      })
    )
  );

  if (ignoreFilters.size) {
    log.info('ignoring diff in paths matching', ignorePatterns.join(' '));
  }

  return function hasDiffSinceThatIsntIgnored(/** @type {import("@lerna/package-graph").PackageGraphNode} */ node) {
    const diff = diffSinceIn(committish, node.location, execOpts, diffOpts);

    if (diff === '') {
      log.silly('', 'no diff found in %s', node.name);
      return false;
    }

    log.silly('found diff in', diff);
    let changedFiles = diff.split('\n');

    if (ignoreFilters.size) {
      for (const ignored of ignoreFilters) {
        changedFiles = changedFiles.filter(ignored);
      }
    }

    if (changedFiles.length) {
      log.verbose('filtered diff', changedFiles.join(' '));
    } else {
      log.verbose('', 'no diff found in %s (after filtering)', node.name);
    }

    return changedFiles.length > 0;
  };
}

/**
 * @param {string} committish
 * @param {string} location
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 */
function diffSinceIn(committish: string, location: string, execOpts: ExecOpts, diffOpts: { independentSubpackages?: boolean }) {
  const args = ['diff', '--name-only', committish];
  const formattedLocation = slash(relative(execOpts.cwd, location));

  if (formattedLocation) {
    // avoid same-directory path.relative() === ""
    let independentSubpackages: string[] = [];

    // optionally exclude sub-packages
    if (diffOpts?.independentSubpackages) {
      independentSubpackages = globbySync('**/*/package.json', {
        cwd: formattedLocation,
        nodir: true,
        ignore: '**/node_modules/**',
      }).map((file) => `:^${formattedLocation}/${dirname(file)}`);
    }

    // avoid same-directory path.relative() === ""
    args.push('--', formattedLocation, ...independentSubpackages);
  }

  log.silly('checking diff', formattedLocation);
  return execSync('git', args, execOpts);
}
