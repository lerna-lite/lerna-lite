import { globby, globbySync, Options as GlobbyOptions } from 'globby';
import { normalize as pathNormalize, posix } from 'node:path';
import pMap from 'p-map';

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
  } as GlobbyOptions;

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

export function makeFileFinder(rootPath: string, packageConfigs: string[]) {
  const globOpts = getGlobOpts(rootPath, packageConfigs);

  return (fileName: string, fileMapper: any, customGlobOpts?: any) => {
    const options = Object.assign({}, customGlobOpts, globOpts);
    const promise = pMap(
      Array.from(packageConfigs).sort(),
      (globPath: string) => {
        let chain: Promise<any> = globby(posix.join(globPath, fileName), options);

        // fast-glob does not respect pattern order, so we re-sort by absolute path
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
    customGlobOpts?: GlobbyOptions
  ) => {
    const options: GlobbyOptions = Object.assign({}, customGlobOpts, globOpts);
    const patterns = packageConfigs.map((globPath) => posix.join(globPath, fileName)).sort();

    let results: string[] = globbySync(patterns, options);

    // POSIX results always need to be normalized
    results = normalize(results);

    if (fileMapper) {
      results = results.map(fileMapper);
    }

    return results;
  };
}
