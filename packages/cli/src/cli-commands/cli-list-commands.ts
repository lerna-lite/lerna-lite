import type { ListCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options.js';
import { parseSubcommand } from '../yargs-compat.js';
import { listableOptions } from './listable/listable-options.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const mod = {
  command: 'list',
  aliases: ['ls', 'la', 'll'],
  describe: 'List local packages',
  builder: (yargs) => {
    listableOptions(yargs);

    return filterOptions(yargs);
  },

  handler: async (argv: ListCommandOption) => {
    try {
      // @ts-ignore
      const { ListCommand } = await import('@lerna-lite/list');
      // return the command instance (thenable) so callers can await its lifecycle
      return new ListCommand(argv);
    } catch (err: any) {
      throw new Error(
        `"@lerna-lite/list" is optional and was not found. Please install it with "npm install @lerna-lite/list -D". ${err}`
      );
    }
  },
};

// cli-nano pilot config for this command
export const cliNanoConfig = {
  command: { name: 'list', positionals: [] as any[] },
  options: {
    // listable options
    json: { type: 'boolean' },
    ndjson: { type: 'boolean' },
    all: { type: 'boolean', alias: 'a' },
    long: { type: 'boolean', alias: 'l' },
    parseable: { type: 'boolean', alias: 'p' },
    toposort: { type: 'boolean' },
    graph: { type: 'boolean' },
    // filter options
    scope: { type: 'string' },
    ignore: { type: 'string' },
    'no-private': { type: 'boolean' },
    private: { type: 'boolean' },
    since: { type: 'string' },
    'exclude-dependents': { type: 'boolean' },
    'include-dependents': { type: 'boolean' },
    'include-dependencies': { type: 'boolean' },
    'include-merged-tags': { type: 'boolean' },
    'continue-if-no-match': { type: 'boolean' },
  },
} as const;

// attach pilots to the module export
(mod as any).runWithCliNano = runWithCliNano;
(mod as any).cliNanoConfig = cliNanoConfig;

export default mod;

// Pilot runner: parse with cli-nano and call existing handler
export async function runWithCliNano(rawArgs?: string[], context?: any) {
  const parsed: any = parseSubcommand(cliNanoConfig as any, rawArgs, context);

  return await (mod.handler as any)(parsed as ListCommandOption);
}
