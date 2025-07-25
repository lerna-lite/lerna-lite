import util from 'node:util';

import type { Package } from '@lerna-lite/core';
import { ValidationError } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import picomatch from 'picomatch';

/**
 * Filters a list of packages, returning all packages that match the `include` glob[s]
 * and do not match the `exclude` glob[s].
 *
 * @param {import('@lerna/package').Package[]} packagesToFilter The packages to filter
 * @param {string[]} [include] A list of globs to match the package name against
 * @param {string[]} [exclude] A list of globs to filter the package name against
 * @param {boolean} [showPrivate] When false, filter out private packages
 * @param {boolean} [continueIfNoMatch] When true, do not throw if no package is matched
 * @throws when a given glob would produce an empty list of packages and `continueIfNoMatch` is not set.
 */
export function filterPackages(
  packagesToFilter: Package[],
  include: string[] = [],
  exclude: string[] = [],
  showPrivate?: boolean,
  continueIfNoMatch?: boolean
) {
  const filtered = new Set(packagesToFilter);
  const patterns: string[] = ([] as string[]).concat(arrify(include), negate(exclude));

  if (showPrivate === false) {
    for (const pkg of filtered) {
      if (pkg.private) {
        filtered.delete(pkg);
      }
    }
  }

  if (patterns.length) {
    log.info('filter', JSON.stringify(patterns));

    if (!include.length) {
      // only excludes needs to select all items first
      // globstar is for matching scoped packages
      patterns.unshift('**');
    }

    const pnames = Array.from(filtered).map((pkg) => pkg?.name ?? '');
    const chosen = new Set();

    for (const pattern of patterns) {
      const isNegation = pattern[0] === '!';
      const matcher = picomatch(isNegation ? pattern.slice(1) : pattern);

      for (const name of pnames) {
        if (matcher(name)) {
          if (isNegation) {
            chosen.delete(name);
          } else {
            chosen.add(name);
          }
        }
      }
    }

    for (const pkg of filtered) {
      if (!chosen.has(pkg?.name ?? '')) {
        filtered.delete(pkg);
      }
    }

    if (!filtered.size && !continueIfNoMatch) {
      throw new ValidationError('EFILTER', util.format('No packages remain after filtering', patterns));
    }
  }

  return Array.from(filtered);
}

/**
 * @param {string[]|string|undefined} thing
 */
function arrify(thing: string[] | string | undefined): string[] {
  if (!thing) {
    return [];
  }

  if (!Array.isArray(thing)) {
    return [thing];
  }

  return thing;
}

/**
 * @param {string[]} patterns
 */
function negate(patterns: string[]): string[] {
  return arrify(patterns).map((pattern) => `!${pattern}`);
}
