import type { ChangedCommandOption, ListCommandOption } from '@lerna-lite/core';
import * as cliNano from 'cli-nano';

import { filterOptions } from '../filter-options.js';
import { listableOptions } from './listable/listable-options.js';

// cli-nano config (pilot): provide a direct cli-nano representation
// for this command so consumers can migrate to `cli-nano.parseArgs()`.
export const cliNanoConfig = {
  command: { name: 'changed', positionals: [] as any[] },
  options: {
    'conventional-commits': { hidden: true, type: 'boolean' },
    'conventional-graduate': {
      /* overloaded */
    },
    'force-conventional-graduate': { type: 'boolean' },
    'force-publish': {
      /* overloaded */
    },
    'ignore-changes': { type: 'array' },
    'include-merged-tags': { type: 'boolean' },
  },
} as const;

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const mod = {
  command: 'changed',
  aliases: ['updated'],
  describe: 'List local packages that have changed since the last tagged release',
  builder: (yargs: any) => {
    const opts = {
      // only the relevant bits from `lerna version`
      'conventional-commits': {
        // fallback for overzealous --conventional-graduate
        hidden: true,
        type: 'boolean',
      },
      'conventional-graduate': {
        describe: 'Detect currently prereleased packages that would change to a non-prerelease version.',
        // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
      },
      'force-conventional-graduate': {
        describe:
          'Always include all packages by specified by --conventional-graduate whether or not they are a prerelease or have changes since the previous version.',
        type: 'boolean',
      },
      'force-publish': {
        describe: 'Always include targeted packages when detecting changed packages, skipping default logic.',
        // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
      },
      'ignore-changes': {
        describe: [
          'Ignore changes in files matched by glob(s) when detecting changed packages.',
          'Pass --no-ignore-changes to completely disable.',
        ].join('\n'),
        type: 'array',
      },
      'include-merged-tags': {
        describe: 'Include tags from merged branches when detecting changed packages.',
        type: 'boolean',
      },
    };

    yargs.options(opts).group(Object.keys(opts), 'Command Options:');
    filterOptions(yargs);

    return listableOptions(yargs, 'Output Options:');
  },

  handler: async (argv: ChangedCommandOption & ListCommandOption) => {
    try {
      // @ts-ignore
      const { ChangedCommand } = await import('@lerna-lite/changed');
      // return the command instance (thenable) so callers can await its lifecycle
      return new ChangedCommand(argv);
    } catch (err: any) {
      throw new Error(
        `"@lerna-lite/changed" is optional and was not found. Please install it with "npm install @lerna-lite/changed -D". ${err}`
      );
    }
  },
};

export default mod;

// Attach pilot helpers to the default export so consumers importing the
// default yargs-style module can opt into the cli-nano runner without
// changing their import site.
(mod as any).runWithCliNano = runWithCliNano;
(mod as any).cliNanoConfig = cliNanoConfig;

// Pilot helper: run this command using cli-nano's parseArgs config.
export async function runWithCliNano(rawArgs?: string[]) {
  // Merge listable options (short aliases like `-a`, `-l`, `-p`) so
  // cli-nano recognizes grouped short flags (e.g. `-alp`). This mirrors
  // what `listableOptions(yargs)` would register in the yargs path.
  const mergedOptions = Object.assign({}, cliNanoConfig.options, {
    json: { type: 'boolean' },
    ndjson: { type: 'boolean' },
    all: { type: 'boolean', alias: 'a' },
    long: { type: 'boolean', alias: 'l' },
    parseable: { type: 'boolean', alias: 'p' },
    toposort: { type: 'boolean' },
    graph: { type: 'boolean' },
  });

  const config = {
    command: cliNanoConfig.command,
    options: mergedOptions,
  } as const;

  const originalArgv = process.argv;
  try {
    // expand grouped short flags (e.g. `-alp` -> `-a -l -p`) so cli-nano
    // recognizes combined single-letter options the same way yargs does.
    const expandShortFlags = (args: string[] = []) => {
      const out: string[] = [];
      for (const a of args) {
        if (a.startsWith('-') && !a.startsWith('--') && a.length > 2 && /^-[A-Za-z]+$/.test(a)) {
          // split into individual short flags
          for (let i = 1; i < a.length; i++) {
            out.push('-' + a[i]);
          }
        } else {
          out.push(a);
        }
      }
      return out;
    };

    const expanded = expandShortFlags(rawArgs || []);
    process.argv = [process.argv[0], process.argv[1], ...expanded];
    const parsed = (cliNano as any).parseArgs(config as any);

    // ensure positional array exists so downstream code (listable) can
    // safely inspect `options._[0]` without crashing when absent
    if (!Array.isArray(parsed._)) {
      parsed._ = [];
    }

    // `cli-nano` will now receive alias metadata and populate full-name
    // properties accordingly; no post-parse alias mapping required.

    // normalize positionals into named properties (none for changed)
    try {
      const pos = (cliNanoConfig.command as any)?.positionals || ([] as any[]);
      if (Array.isArray(parsed._) && pos.length) {
        for (let i = 0; i < pos.length; i++) {
          const name = pos[i].name;
          if (parsed._[i] !== undefined) {
            parsed[name] = parsed._[i];
          }
        }
      }
    } catch (e) {
      // ignore normalization errors
    }

    // call the same handler with parsed args
    return await (mod.handler as any)(parsed as ChangedCommandOption & ListCommandOption);
  } finally {
    process.argv = originalArgv;
  }
}
