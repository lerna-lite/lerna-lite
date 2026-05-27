import type { ExecCommandOption } from '@lerna-lite/core';
// parsing delegated to parseSubcommand from yargs-compat

import { filterOptions } from '../filter-options.js';
import { parseSubcommand } from '../yargs-compat.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const mod = {
  command: 'exec [cmd] [args..]',
  describe: 'Execute an arbitrary command in each package',
  builder: (yargs: any) => {
    yargs
      .example('$0 exec ls -- --la', '# execute `ls -la` in all packages')
      .example('$0 exec -- ls --la', '# execute `ls -la` in all packages, keeping cmd outside')
      .parserConfiguration({
        'populate--': true,
      })
      .positional('cmd', {
        describe: 'The command to execute. Any command flags must be passed after --',
        type: 'string',
      })
      .positional('args', {
        describe: 'Positional arguments (not recognized by lerna) to send to command',
        type: 'string',
      })
      .options({
        stream: {
          group: 'Command Options:',
          describe: 'Stream output with lines prefixed by originating package name.',
          type: 'boolean',
        },
        parallel: {
          group: 'Command Options:',
          describe: 'Execute command with unlimited concurrency, streaming prefixed output.',
          type: 'boolean',
        },
        'no-bail': {
          group: 'Command Options:',
          describe: 'Continue executing command despite non-zero exit in a given package.',
          type: 'boolean',
        },
        bail: {
          // proxy for --no-bail
          hidden: true,
          type: 'boolean',
        },
        'no-shell': {
          group: 'Command Options:',
          describe: 'Do not run the command within a shell (spawns the executable directly).',
          type: 'boolean',
        },
        shell: {
          // proxy for --no-shell
          hidden: true,
          type: 'boolean',
          default: true,
        },
        // This option controls prefix for stream output so that it can be disabled to be friendly
        // to tools like Visual Studio Code to highlight the raw results
        'no-prefix': {
          group: 'Command Options:',
          describe: 'Do not prefix streaming output.',
          type: 'boolean',
        },
        prefix: {
          // proxy for --no-prefix
          hidden: true,
          type: 'boolean',
        },
        profile: {
          group: 'Command Options:',
          describe: 'Profile command executions and output performance profile to default location.',
          type: 'boolean',
        },
        'profile-location': {
          group: 'Command Options:',
          describe: 'Output performance profile to custom location instead of default project root.',
          type: 'string',
        },
        'dry-run': {
          group: 'Command Options:',
          describe: 'Displays the execution command that would be performed without executing it.',
          type: 'boolean',
        },
      });

    return filterOptions(yargs);
  },

  handler: async (argv: ExecCommandOption) => {
    try {
      // @ts-ignore
      const { ExecCommand } = await import('@lerna-lite/exec');
      // return the command instance (thenable) so callers can await its lifecycle
      return new ExecCommand(argv);
    } catch (err: any) {
      throw new Error(
        `"@lerna-lite/exec" is optional and was not found. Please install it with "npm install @lerna-lite/exec -D". ${err}`
      );
    }
  },
};

// cli-nano pilot config for this command
export const cliNanoConfig = {
  command: {
    name: 'exec',
    positionals: [
      { name: 'cmd', type: 'string' },
      { name: 'args', variadic: true, type: 'string' },
    ] as any[],
  },
  options: {
    stream: { type: 'boolean' },
    parallel: { type: 'boolean' },
    bail: { type: 'boolean', default: true },
    shell: { type: 'boolean', default: true },
    prefix: { type: 'boolean', default: true },
    profile: { type: 'boolean' },
    'profile-location': { type: 'string' },
    'dry-run': { type: 'boolean' },
    concurrency: { type: 'number' },
    'reject-cycles': { type: 'boolean' },
    // filterOptions (used by many commands)
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
  // Delegate parsing/normalization to `parseSubcommand`, which already
  // handles short-flag expansion, injection/stripping of the subcommand
  // token, positional mapping, defaults, and validation.
  const parsed: any = parseSubcommand(cliNanoConfig as any, rawArgs, context, { sort: { type: 'boolean' } });

  return await (mod.handler as any)(parsed as ExecCommandOption);
}
