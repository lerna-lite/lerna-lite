import log from 'npmlog';

import { DescribeRefDetailedResult, DescribeRefFallbackResult, DescribeRefOptions } from '../models';
import { exec, execSync } from '../child-process';

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
  gitDryRun = false
): Promise<DescribeRefFallbackResult | DescribeRefDetailedResult> {
  const promise = exec('git', getArgs(options, includeMergedTags), options, gitDryRun);

  return promise.then(({ stdout } = { stdout: '' }) => {
    const result = parse(stdout, options.cwd);

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
function describeRefSync(options: DescribeRefOptions = {}, includeMergedTags?: boolean, gitDryRun = false) {
  const stdout = execSync('git', getArgs(options, includeMergedTags), options, gitDryRun);
  const result = parse(stdout, options.cwd);

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
 * @returns {DescribeRefFallbackResult|DescribeRefDetailedResult}
 */
function parse(stdout: string, cwd?: string): DescribeRefFallbackResult | DescribeRefDetailedResult {
  const minimalShaRegex = /^([0-9a-f]{7,40})(-dirty)?$/;
  // when git describe fails to locate tags, it returns only the minimal sha
  if (minimalShaRegex.test(stdout)) {
    // repo might still be dirty
    const [, sha, isDirty] = minimalShaRegex.exec(stdout) as any;

    // count number of commits since beginning of time
    const refCount = execSync('git', ['rev-list', '--count', sha], { cwd });

    return { refCount, sha, isDirty: Boolean(isDirty) };
  }

  const [, lastTagName, lastVersion, refCount, sha, isDirty] =
    /^((?:.*@)?(.*))-(\d+)-g([0-9a-f]+)(-dirty)?$/.exec(stdout) || [];

  return { lastTagName, lastVersion, refCount, sha, isDirty: Boolean(isDirty) };
}

export { describeRef, describeRefSync };
