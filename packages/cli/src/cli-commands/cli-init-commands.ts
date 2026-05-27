import type { InitCommandOption } from '@lerna-lite/core';
import { InitCommand } from '@lerna-lite/init';

import { parseSubcommand } from '../yargs-compat.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const mod = {
  command: 'init',
  describe: 'Create a new Lerna repo or upgrade an existing repo to the current version of Lerna.',
  builder: {
    exact: {
      describe: 'Specify lerna dependency version in package.json without a caret (^)',
      type: 'boolean',
    },
    independent: {
      describe: 'Version packages independently',
      alias: 'i',
      type: 'boolean',
    },
    'use-workspaces': {
      group: 'Command Options:',
      describe: 'Enable integration with Yarn workspaces.',
      type: 'boolean',
    },
  },
  handler: (argv: InitCommandOption) => {
    return new InitCommand(argv);
  },
};

export default mod;

// cli-nano pilot config for this command
export const cliNanoConfig = {
  command: { name: 'init', positionals: [] as any[] },
  options: {
    exact: { type: 'boolean' },
    independent: { type: 'boolean', alias: 'i' },
    'use-workspaces': { type: 'boolean' },
  },
} as const;

// attach pilot helpers to the default export
(mod as any).runWithCliNano = runWithCliNano;
(mod as any).cliNanoConfig = cliNanoConfig;

export async function runWithCliNano(rawArgs?: string[], context?: any) {
  const parsed: any = parseSubcommand(cliNanoConfig as any, rawArgs, context);
  return await (mod.handler as any)(parsed as InitCommandOption);
}
