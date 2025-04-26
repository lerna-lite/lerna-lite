import { log } from '@lerna-lite/npmlog';
import { join } from 'node:path';
import { filter as minimatchFilter } from 'minimatch';
import { readFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import slash from 'slash';
import { globSync } from 'tinyglobby';
import { parse } from 'yaml';

import { execSync } from '../../../child-process.js';
import type { ExecOpts } from '../../../models/interfaces.js';
import { type PackageGraphNode } from '../../../package-graph/lib/package-graph-node.js';

/**
 * @param {string} committish
 * @param {ExecOpts} execOpts
 * @param {string[]} ignorePatterns - package patterns to ignore
 * @param {string[]} changedCatalogDeps - dependencies that changed in the workspace catalog
 * @param {object} diffOpts - options for diff
 * @param {boolean} diffOpts.independentSubpackages - whether to include independent subpackages in the diff
 */
export function makeDiffPredicate(
  committish: string,
  execOpts: ExecOpts,
  ignorePatterns: string[] = [],
  changedCatalogDeps: string[] = [],
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

  return function hasDiffSinceThatIsntIgnored(node: PackageGraphNode) {
    let hasDiff = true;
    const diff = diffSinceIn(committish, node.location, execOpts, diffOpts);

    if (diff === '') {
      log.silly('', 'no diff found in %s', node.name);
      hasDiff = false;
    }

    if (hasDiff) {
      log.silly('found diff in', diff);
      let changedFiles = diff.split('\n');

      if (ignoreFilters.size) {
        for (const ignored of ignoreFilters) {
          changedFiles = changedFiles.filter(ignored);
        }
      }

      hasDiff = changedFiles.length > 0;

      if (hasDiff) {
        log.verbose('filtered diff', changedFiles.join(' '));
      } else {
        log.verbose('', 'no diff found in %s (after filtering)', node.name);
      }
    }

    // last check, user might use pnpm catalog, if so check if current node package has changes found in catalog
    if (!hasDiff && Array.from(node.externalDependencies).some(([depName]) => changedCatalogDeps.includes(depName))) {
      log.silly('', 'diff found in catalog dependencies on package %s', node.name);
      hasDiff = true;
    }

    return hasDiff;
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
      independentSubpackages = globSync('**/*/package.json', {
        cwd: formattedLocation,
        onlyDirectories: false,
        ignore: ['**/node_modules/**'],
      }).map((file) => `:^${formattedLocation}/${dirname(file)}`);
    }

    // avoid same-directory path.relative() === ""
    args.push('--', formattedLocation, ...independentSubpackages);
  }

  log.silly('checking diff', formattedLocation);
  return execSync('git', args, execOpts);
}

/**
 * When using pnpm workspace catalog(s), we will compare current catalogs against the previous commit's catalogs
 * and return dependencies that changed since then.
 */
export function diffWorkspaceCatalog(prevTag: string): string[] {
  const workspaceConfigPath = join(process.cwd(), 'pnpm-workspace.yaml');
  const previousContents = execSync('git', ['show', `${prevTag}:pnpm-workspace.yaml`]);

  // Get the current commit's file contents
  const currentContents = readFileSync(workspaceConfigPath, 'utf8');

  // Parse the YAML files
  const previousConfig = parse(previousContents);
  const currentConfig = parse(currentContents);

  // Find the changed dependencies
  const changedDependencies: string[] = [];
  Object.keys(currentConfig.catalog).forEach((key) => {
    if (!previousConfig.catalog[key] || previousConfig.catalog[key] !== currentConfig.catalog[key]) {
      changedDependencies.push(key);
    }
  });

  const diffOutput = execSync('git', ['diff', `${prevTag}..HEAD`, '--', 'pnpm-workspace.yaml']);
  const diffLines = diffOutput.split('\n');
  const changedDependenciesFromDiff: string[] = [];
  diffLines.forEach((line) => {
    if (line.startsWith('+ catalog.') && line.includes(':')) {
      const key = line.substring(11).split(':')[0].trim();
      changedDependenciesFromDiff.push(key);
    } else if (line.startsWith('+   ') && line.includes(':')) {
      const key = line.substring(5).split(':')[0].trim();
      changedDependenciesFromDiff.push(key);
    }
  });

  return changedDependencies;
}
