import { log } from '@lerna-lite/npmlog';

import { DescribeRefDetailedResult, DescribeRefFallbackResult, DescribeRefOptions } from '../models/interfaces.js';
import { exec, execSync } from '../child-process.js';

/**
 * Build `git describe` args.
 * @param {DescribeRefOptions} options
 * @param {boolean} [includeMergedTags]
 */
function getArgs(options: DescribeRefOptions, includeMergedTags?: boolean) {
  let args = [
    'describe',
    // fallback to short sha if no tags located
    '--always',
    // always return full result, helps identify existing release
    '--long',
    // annotate if uncommitted changes present
    '--dirty',
    // prefer tags originating on upstream branch
    '--first-parent',
  ];

  if (options.match) {
    args.push('--match', options.match);
  }

  if (includeMergedTags) {
    // we want to consider all tags, also from merged branches
    args = args.filter((arg) => arg !== '--first-parent');
  }

  return args;
}

/**
 * @param {DescribeRefOptions} [options]
 * @param {boolean} [includeMergedTags]
 * @returns {Promise<DescribeRefFallbackResult|DescribeRefDetailedResult>}
 */
function describeRef(
  options: DescribeRefOptions = {},
  includeMergedTags?: boolean,
  dryRun = false
): Promise<DescribeRefFallbackResult | DescribeRefDetailedResult> {
  const promise = exec('git', getArgs(options, includeMergedTags), options, dryRun);

  return promise.then(({ stdout } = { stdout: '' }) => {
    const result = parse(stdout, options.cwd, options.separator);

    if (options?.match) {
      log.verbose('git-describe', '%j => %j', options?.match, stdout);
    }
    if (stdout) {
      log.silly('git-describe', 'parsed => %j', result);
    }

    return result;
  });
}

/**
 * @param {DescribeRefOptions} [options]
 * @param {boolean} [includeMergedTags]
 */
function describeRefSync(
  options: DescribeRefOptions = {},
  includeMergedTags?: boolean,
  dryRun = false
): DescribeRefFallbackResult | DescribeRefDetailedResult {
  const stdout = execSync('git', getArgs(options, includeMergedTags), options, dryRun);
  const result = parse(stdout, options.cwd, options.separator);

  if (options?.match) {
    log.verbose('git-describe.sync', '%j => %j', options?.match, stdout);
  }
  if (stdout) {
    log.silly('git-describe', 'parsed => %j', result);
  }

  return result;
}

/**
 * Parse git output and return relevant metadata.
 * @param {string} stdout Result of `git describe`
 * @param {string} [cwd] Defaults to `process.cwd()`
 * @param [separator] Separator used within independent version tags, defaults to @
 * @returns {DescribeRefFallbackResult|DescribeRefDetailedResult}
 */
function parse(stdout: string, cwd?: string, separator?: string): DescribeRefFallbackResult | DescribeRefDetailedResult {
  separator = separator || '@';
  const minimalShaRegex = /^([0-9a-f]{7,40})(-dirty)?$/;
  // when git describe fails to locate tags, it returns only the minimal sha
  if (minimalShaRegex.test(stdout)) {
    // repo might still be dirty
    const [, sha, isDirty] = minimalShaRegex.exec(stdout) as any;

    // count number of commits since beginning of time
    const refCount = execSync('git', ['rev-list', '--count', sha], { cwd });

    return { refCount, sha, isDirty: Boolean(isDirty) };
  }

  // If the user has specified a custom separator, it may not be regex-safe, so escape it
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexPattern = new RegExp(`^((?:.*${escapedSeparator})?(.*))-(\\d+)-g([0-9a-f]+)(-dirty)?$`);

  const [, lastTagName, lastVersion, refCount, sha, isDirty] = regexPattern.exec(stdout) || [];

  return { lastTagName, lastVersion, refCount, sha, isDirty: Boolean(isDirty) };
}

export { describeRef, describeRefSync };
