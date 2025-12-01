import { type log } from '@lerna-lite/npmlog';
import dedent from 'dedent';
import type { Argv, Options } from 'yargs';

export interface FilterOptions {
  scope?: string;
  ignore?: string;
  private?: boolean;
  since?: string;
  continueIfNoMatch?: boolean;
  excludeDependents?: boolean;
  includeDependents?: boolean;
  includeDependencies?: boolean;
  includeMergedTags?: boolean;
  log: typeof log;
}

export function filterOptions<T extends FilterOptions>(yargs: Argv<object>): Argv<T> {
  // Only for `exec` and 'run' commands
  const opts: { [name: string]: Options } = {
    scope: {
      describe: 'Include only packages with names matching the given glob.',
      type: 'string',
      requiresArg: true,
    },
    ignore: {
      describe: 'Exclude packages with names matching the given glob.',
      type: 'string',
      requiresArg: true,
    },
    'no-private': {
      describe: 'Exclude packages with { "private ": true } in their package.json.',
      type: 'boolean',
    },
    private: {
      // proxy for --no-private
      hidden: true,
      type: 'boolean',
    },
    since: {
      describe: dedent`
        Only include packages that have been changed since the specified [ref].
        If no ref is passed, it defaults to the most-recent tag.
      `,
      type: 'string',
    },
    'exclude-dependents': {
      describe: dedent`
        Exclude all transitive dependents when running a command
        with --since, overriding the default 'changed' algorithm.
      `,
      conflicts: 'include-dependents',
      type: 'boolean',
    },
    'include-dependents': {
      describe: dedent`
        Include all transitive dependents when running a command
        regardless of --scope, --ignore, or --since.
      `,
      conflicts: 'exclude-dependents',
      type: 'boolean',
    },
    'include-dependencies': {
      describe: dedent`
        Include all transitive dependencies when running a command
        regardless of --scope, --ignore, or --since.
      `,
      type: 'boolean',
    },
    'include-merged-tags': {
      describe: 'Include tags from merged branches when running a command with --since.',
      type: 'boolean',
    },
    'continue-if-no-match': {
      describe: `Don't fail if no package is matched`,
      hidden: true,
      type: 'boolean',
    },
  };

  return yargs.options(opts).group(Object.keys(opts), 'Filter Options:') as Argv<T>;
}
