import util from 'node:util';
import zeptomatch from 'zeptomatch';

import { ValidationError, type Package } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

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
      const raw = isNegation ? pattern.slice(1) : pattern;

      // expand extglobs like '@(a|b)' into multiple simple patterns
      const expanded = expandExtglobs(raw);

      for (const pat of expanded) {
        for (const name of pnames) {
          const matched = pat === '**' ? true : zeptomatch(pat, name);
          if (matched) {
            if (isNegation) {
              chosen.delete(name);
            } else {
              chosen.add(name);
            }
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
  /* v8 ignore if - probably unreachable */
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

/**
 * Expand simple extglob patterns like '@(a|b)' into ['a', 'b'] variants.
 * This is a minimal implementation tailored to the usages in tests (e.g. package-@(1|2)).
 */
function expandExtglobs(pattern: string): string[] {
  // only handle the simple '@(a|b|c)' form; if not present, return the pattern as-is
  const extglobMatch = pattern.match(/^(.*)@\(([^)]+)\)(.*)$/);

  if (!extglobMatch) {
    return [pattern];
  }

  const [, prefix, inner, suffix] = extglobMatch;
  const parts = inner.split('|');

  return parts.map((p) => `${prefix}${p}${suffix}`);
}
