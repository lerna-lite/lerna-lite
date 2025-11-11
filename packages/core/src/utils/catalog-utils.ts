import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as yamlParse } from 'yaml';

import type { NpmClient } from '../models/interfaces.js';

import { looselyJsonParse } from './object-utils.js';

export type CatalogConfig =
  | {
      catalog: Record<string, string>;
      catalogs: Record<string, Record<string, string>>;
    }
  | {
      catalog: Record<string, never>;
      catalogs: {
        default: Record<string, string>;
        [key: string]: Record<string, string>;
      };
    };

/**
 * Extract catalog config from package manager (pnpm/yarn) config files located in the project root.
 * From a file content that is either provided as argument or read it from the project root config when null,
 * it will then parse that file content and return all pnpm catalog(s) config
 * @param {String} [yamlContent] - optional yaml file content
 * @returns
 */
export function extractCatalogConfigFromYaml(npmClient: NpmClient = 'pnpm', yamlContent?: string): CatalogConfig {
  let fileContent = yamlContent || '';
  if (!yamlContent) {
    const yamlPath = join(process.cwd(), getClientConfigFilename(npmClient));
    if (existsSync(yamlPath)) {
      fileContent = readFileSync(yamlPath, 'utf8');
    }
  }

  const config = yamlParse(fileContent) || {};
  return {
    catalog: config.catalog || {},
    catalogs: config.catalogs || {},
  };
}

/** Get the root config filename depending on the package manager client name */
export function getClientConfigFilename(npmClient: NpmClient): string {
  if (npmClient === 'pnpm') {
    return 'pnpm-workspace.yaml';
  } else if (npmClient === 'yarn') {
    return '.yarnrc.yml';
  }
  /* v8 ignore next */
  return 'unknown-config';
}

/**
 * Extract catalog config from the `workspaces` located in the project root `package.json` (it also works at the top-level `package.json`).
 * From a file content that is either provided as argument or read it from the `package.json` when null,
 * it will then parse that file content and return all pnpm catalog(s) config
 * @param {String} [pkgContent] - optional JSON stringified package file content
 * @returns
 */
export function extractCatalogConfigFromPkg(pkgContent?: string): CatalogConfig {
  let fileContent = pkgContent || '';
  if (!pkgContent) {
    const pkgPath = join(process.cwd(), 'package.json');
    if (existsSync(pkgPath)) {
      fileContent = readFileSync(pkgPath, 'utf8');
    }
  }

  const pkg = looselyJsonParse(fileContent) || {};

  // get catalog(s) from `workspaces` field and/or from top-level `package.json`
  return {
    catalog: pkg.workspaces?.catalog ?? pkg.catalog ?? {},
    catalogs: pkg.workspaces?.catalogs ?? pkg.catalogs ?? {},
  };
}

/**
 * Compare the before/after catalog(s) config and return any dependencies that changed in the workspace catalog.
 * @param {CatalogConfig} prev - previous catalog(s) config
 * @param {CatalogConfig} curr - current catalog(s) config
 * @returns
 */
export function diffCatalogs(prev: CatalogConfig, curr: CatalogConfig): Set<string> {
  const changed = new Set<string>();

  // Helper to compare two dependency maps for added, removed, or changed deps
  const compareDeps = (prevDeps: Record<string, string> = {}, currDeps: Record<string, string> = {}) => {
    const allDeps = new Set([...Object.keys(prevDeps), ...Object.keys(currDeps)]);
    for (const dep of allDeps) {
      if (!(dep in prevDeps) || !(dep in currDeps) || prevDeps[dep] !== currDeps[dep]) {
        changed.add(dep);
      }
    }
  };

  compareDeps(prev.catalog, curr.catalog);

  const prevCatalogs = prev.catalogs || {};
  const currCatalogs = curr.catalogs || {};
  const allCatalogNames = new Set([...Object.keys(prevCatalogs), ...Object.keys(currCatalogs)]);
  for (const catName of allCatalogNames) {
    compareDeps(prevCatalogs[catName], currCatalogs[catName]);
  }

  return changed;
}

/** read the workspaces catalog depending on the npm client (currently support 'pnpm' and 'bun') */
export function readWorkspaceCatalogConfig(npmClient: NpmClient) {
  if (npmClient === 'pnpm' || npmClient === 'yarn') {
    return extractCatalogConfigFromYaml(npmClient);
  } else if (npmClient === 'bun') {
    return extractCatalogConfigFromPkg();
  }

  return { catalog: {}, catalogs: {} };
}
