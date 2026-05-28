import type { GlobOptions as NativeGlobOptions } from 'node:fs';
import { globSync, lstatSync, statSync } from 'node:fs';
import { normalize as pathNormalize, posix, resolve } from 'node:path';

import { pMap } from '../../utils/p-map.js';
import { ValidationError } from '../../validation-error.js';

/**
 * @param {string[]} results
 */
function normalize(results: string[]) {
  return results.map((fp) => pathNormalize(fp));
}

function getGlobOpts(rootPath: string, packageConfigs: string[]) {
  const globOpts = {
    cwd: rootPath,
    absolute: true,
    expandDirectories: false,
    followSymbolicLinks: false,
  } as NativeGlobOptions & {
    ignore?: string[];
    absolute?: boolean;
    onlyDirectories?: boolean;
    followSymbolicLinks?: boolean;
  };

  if (packageConfigs.some((cfg) => cfg.indexOf('**') > -1)) {
    if (packageConfigs.some((cfg) => cfg.indexOf('node_modules') > -1)) {
      throw new ValidationError('EPKGCONFIG', 'An explicit node_modules package path does not allow globstars (**)');
    }

    (globOpts as any).ignore = [
      // allow globs like "packages/**",
      // but avoid picking up node_modules/**/package.json
      '**/node_modules/**',
    ];
  }

  return globOpts;
}

function createGlobSyncOptions(options: any) {
  const globOpts: any = {
    cwd: options.cwd,
    exclude: options.ignore,
    withFileTypes: false,
  };

  if (globOpts.exclude === undefined) {
    delete globOpts.exclude;
  }

  if (options.onlyDirectories || options.followSymbolicLinks === false) {
    globOpts.withFileTypes = false;
  }

  if (options.caseSensitiveMatch !== undefined) {
    globOpts.caseSensitiveMatch = options.caseSensitiveMatch;
  }

  return globOpts;
}

function globFiles(pattern: string | readonly string[], options: any) {
  const globOpts = createGlobSyncOptions(options);
  const results = globSync(pattern, globOpts as NativeGlobOptions & { withFileTypes?: false }) as string[];
  const cwd = options.cwd || process.cwd();

  return results
    .filter((result) => {
      const absolutePath = resolve(cwd, result);
      if (options.followSymbolicLinks === false) {
        try {
          return !lstatSync(absolutePath).isSymbolicLink();
        } catch {
          return false;
        }
      }
      return true;
    })
    .filter((result) => {
      if (!options.onlyDirectories) {
        return true;
      }

      try {
        return statSync(resolve(cwd, result)).isDirectory();
      } catch {
        return false;
      }
    })
    .map((result) => (options.absolute ? resolve(cwd, result) : result));
}

export function makeFileFinder(rootPath: string, packageConfigs: string[]) {
  const globOpts = getGlobOpts(rootPath, packageConfigs);

  return (fileName: string, fileMapper: any, customGlobOpts?: any) => {
    const options = Object.assign({}, customGlobOpts, globOpts);
    const promise = pMap(
      Array.from(packageConfigs).sort(),
      (globPath: string) => {
        let chain: Promise<any> = Promise.resolve(globFiles(posix.join(globPath, fileName), options));

        // native glob may not preserve pattern order, so we re-sort by absolute path
        chain = chain.then((results) => results.sort());

        // POSIX results always need to be normalized
        chain = chain.then(normalize);

        if (fileMapper) {
          chain = chain.then(fileMapper);
        }

        return chain;
      },
      { concurrency: 4 }
    );

    // always flatten the results
    return promise.then((results) => results.reduce((acc, result) => acc.concat(result), []));
  };
}

export function makeSyncFileFinder(rootPath: string, packageConfigs: string[]) {
  const globOpts = getGlobOpts(rootPath, packageConfigs);

  return (
    fileName: string,
    fileMapper: (value: string, index: number, array: string[]) => any,
    customGlobOpts?: NativeGlobOptions
  ) => {
    const options: any = Object.assign({}, customGlobOpts, globOpts);
    const patterns = packageConfigs.map((globPath) => posix.join(globPath, fileName)).sort();

    let results: string[] = globFiles(patterns, options);

    // POSIX results always need to be normalized
    results = normalize(results);
    results = results.sort();

    if (fileMapper) {
      results = results.map(fileMapper);
    }

    return results;
  };
}
