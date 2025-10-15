import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { log } from '@lerna-lite/npmlog';
import slash from 'slash';
import { globSync } from 'tinyglobby';
import zeptomatch from 'zeptomatch';
import { execSync } from '../../../child-process.js';
import type { ExecOpts, NpmClient } from '../../../models/interfaces.js';
import { type PackageGraphNode } from '../../../package-graph/lib/package-graph-node.js';
import {
  diffCatalogs,
  extractCatalogConfigFromPkg,
  extractCatalogConfigFromYaml,
  getClientConfigFilename,
  type CatalogConfig,
} from '../../catalog-utils.js';

/**
 * Matches a file path against a glob pattern that may contain a globstar (**).
 * The globstar matches zero or more directories in the file path.
 * Custom function to implement previous implementation of minimatch's `filter` function, but also supports globstar matching.
 * @param {string} pattern - The glob pattern to match against.
 * @param {string} filePath - The file path to check.
 * @returns {boolean} - Returns true if the file path matches the pattern, false otherwise.
 */
function matchGlobstar(pattern: string, filePath: string): boolean {
  const patternParts = pattern.split('**/');
  const filePathParts = filePath.split('/');

  function matchPattern(patternParts: string[], filePathParts: string[]): boolean {
    if (patternParts.length === 0) {
      return true;
    }
    if (patternParts.length > filePathParts.length) {
      return false;
    }

    const patternPart = patternParts[0];
    const filePathPart = filePathParts[0];

    if (patternPart === '') {
      return matchPattern(patternParts.slice(1), filePathParts);
    }

    if (zeptomatch(patternPart, filePathPart)) {
      return matchPattern(patternParts.slice(1), filePathParts.slice(1));
    }

    return matchPattern(patternParts, filePathParts.slice(1));
  }

  return matchPattern(patternParts, filePathParts);
}

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
    ignorePatterns.map((p) => (str) => {
      if (p.includes('**/')) {
        return !matchGlobstar(p, str);
      }
      return !zeptomatch(p, basename(str));
    })
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
        changedFiles = changedFiles.filter((file) => {
          for (const ignored of ignoreFilters) {
            if (!ignored(file)) {
              return false;
            }
          }
          return true;
        });
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
 * Returns associated Catalog dependencies references from a package manager (pnpm,yarn) config file (e.g. `pnpm-workspace.yaml`)
 * or from `package.json` (Bun), it will then return catalog(s) diffs since the previous git tag.
 */
export function diffWorkspaceCatalog(prevTag: string, npmClient: NpmClient): string[] {
  try {
    const cwd = process.cwd();
    const rootPkgPath = join(cwd, 'package.json');

    let prevConfig: CatalogConfig = { catalog: {}, catalogs: {} };
    let currConfig: CatalogConfig = { catalog: {}, catalogs: {} };

    if (npmClient === 'pnpm' || npmClient === 'yarn') {
      // pnpm or yarn catalogs
      const yamlFilename = getClientConfigFilename(npmClient);
      const yamlPath = join(cwd, yamlFilename);
      if (existsSync(yamlPath)) {
        const prevYamlStr = execSync(`git show ${prevTag}:${yamlFilename}`);
        const currYamlStr = readFileSync(yamlPath, 'utf8');
        prevConfig = extractCatalogConfigFromYaml(npmClient, prevYamlStr);
        currConfig = extractCatalogConfigFromYaml(npmClient, currYamlStr);
      }
    } else if (npmClient === 'bun' && existsSync(rootPkgPath)) {
      // Bun catalogs
      const prevJsonStr = execSync(`git show ${prevTag}:package.json`);
      const currJsonStr = readFileSync(rootPkgPath, 'utf8');
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
