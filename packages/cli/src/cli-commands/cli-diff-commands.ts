import type { DiffCommandOption } from '@lerna-lite/core';
import * as cliNano from 'cli-nano';

// cli-nano config (pilot): provide a direct cli-nano representation
// for this command so consumers can migrate to `cli-nano.parseArgs()`.
export const cliNanoConfig = {
  command: { name: 'diff', positionals: [{ name: 'pkgName', variadic: false }] },
  options: {
    'ignore-changes': {
      describe: 'Ignore changes in files matched by glob(s).',
      type: 'array',
    },
  },
};

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const mod = {
  command: 'diff [pkgName]',
  describe: 'Diff all packages or a single package since the last release',
  builder: {
    'ignore-changes': {
      group: 'Command Options:',
      describe: 'Ignore changes in files matched by glob(s).',
      type: 'array',
    },
  },
  handler: async (argv: DiffCommandOption) => {
    try {
      // @ts-ignore
      const { DiffCommand } = await import('@lerna-lite/diff');
      // return the command instance (thenable) so callers can await its lifecycle
      return new DiffCommand(argv);
    } catch (err: any) {
      throw new Error(
        `"@lerna-lite/diff" is optional and was not found. Please install it with "npm install @lerna-lite/diff -D". ${err}`
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
  const config = {
    command: cliNanoConfig.command,
    options: cliNanoConfig.options,
  } as const;

  const originalArgv = process.argv;
  try {
    process.argv = [process.argv[0], process.argv[1], ...(rawArgs || [])];
    const parsed = (cliNano as any).parseArgs(config as any);
    // normalize positionals into named properties (e.g., pkgName)
    // normalize positionals into named properties (e.g., pkgName)
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
      console.log('error', e);
      // ignore normalization errors
    }

    // call the same handler with parsed args
    return await (mod.handler as any)(parsed as DiffCommandOption);
  } finally {
    process.argv = originalArgv;
  }
}
