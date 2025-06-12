import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { log } from '@lerna-lite/npmlog';
import { filter as minimatchFilter } from 'minimatch';
import slash from 'slash';
import { globSync } from 'tinyglobby';

import { execSync } from '../../../child-process.js';
import type { ExecOpts, NpmClient } from '../../../models/interfaces.js';
import { type PackageGraphNode } from '../../../package-graph/lib/package-graph-node.js';
import {
  type CatalogConfig,
  diffCatalogs,
  extractCatalogConfigFromPkg,
  extractCatalogConfigFromYaml,
} from '../../catalog-utils.js';

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
    if (
      !hasDiff &&
      (Array.from(node.externalDependencies).some(([depName]) => changedCatalogDeps.includes(depName)) ||
        Array.from(node.localDependencies).some(([depName]) => changedCatalogDeps.includes(depName)))
    ) {
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
 * Returns dependencies whose semver ranges changed, were added, or removed
 * in pnpm-workspace.yaml
 * or package.json catalog(s) since prevTag.
 */
export function diffWorkspaceCatalog(prevTag: string, npmClient: NpmClient): string[] {
  try {
    const cwd = process.cwd();
    const yamlPath = join(cwd, 'pnpm-workspace.yaml');
    const jsonPath = join(cwd, 'package.json');

    let prevConfig: CatalogConfig = { catalog: {}, catalogs: {} };
    let currConfig: CatalogConfig = { catalog: {}, catalogs: {} };

    if (npmClient === 'pnpm' && existsSync(yamlPath)) {
      // pnpm workspace
      const prevYamlStr = execSync(`git show ${prevTag}:pnpm-workspace.yaml`);
      const currYamlStr = readFileSync(yamlPath, 'utf8');
      prevConfig = extractCatalogConfigFromYaml(prevYamlStr);
      currConfig = extractCatalogConfigFromYaml(currYamlStr);
    } else if (npmClient === 'bun' && existsSync(jsonPath)) {
      // Bun workspace
      const prevJsonStr = execSync(`git show ${prevTag}:package.json`);
      const currJsonStr = readFileSync(jsonPath, 'utf8');
      prevConfig = extractCatalogConfigFromPkg(prevJsonStr);
      currConfig = extractCatalogConfigFromPkg(currJsonStr);
    } else {
      // No supported workspace file found
      return [];
    }

    return Array.from(diffCatalogs(prevConfig, currConfig));
  } catch {
    return [];
  }
}
