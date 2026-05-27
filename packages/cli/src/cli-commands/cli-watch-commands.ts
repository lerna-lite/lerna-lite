import type { WatchCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options.js';
import { parseSubcommand } from '../yargs-compat.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const mod = {
  command: 'watch',
  describe: 'Runs a command whenever packages or their dependents change.',
  builder: (yargs: any) => {
    yargs
      .example(
        '$0 watch -- echo "$LERNA_FILE_CHANGES in package $LERNA_PACKAGE_NAME"',
        '# the file changes with its package name'
      )
      .example(
        '$0 watch --no-bail -- lerna run build --scope=$LERNA_PACKAGE_NAME',
        '# execute `lerna run build` on the package that emitted a change'
      )
      .parserConfiguration({
        'populate--': true,
        'strip-dashed': true,
      })
      .option('command', { type: 'string', hidden: true })
      .options({
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
        debounce: {
          group: 'Command Options:',
          describe: 'Time to wait in milliseconds before emitting all the file changes into a single event, defaults to 200',
          type: 'number',
        },
        'file-delimiter': {
          group: 'Command Options:',
          describe:
            'The delimiter that will be used to separete file when mutiple file changes are emitted by the watch, defaults to whitespace',
          type: 'string',
        },
        glob: {
          group: 'Command Options:',
          describe:
            'Glob pattern to define which file pattern to watch, note that this will be appended to the package file path being watched.',
          type: 'string',
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
        stream: {
          group: 'Command Options:',
          describe: 'Stream output with lines prefixed by originating package name.',
          type: 'boolean',
        },

        // -- Chokidar options
        'await-write-finish': {
          group: 'Command Options:',
          describe: `Defaults to false, by default the add event will fire when a file first appears on disk, before the entire file has been written. Setting awaitWriteFinish to true (or a truthy value) will poll file size, holding its add and change events until the size does not change for a configurable amount of time.`,
          type: 'boolean',
        },
        'awf-stability-threshold': {
          group: 'Command Options:',
          describe:
            'Amount of time in milliseconds for a file size to remain constant before emitting its event, defaults to 2000',
          type: 'number',
        },
        'awf-poll-interval': {
          group: 'Command Options:',
          describe: 'File size polling interval, in milliseconds, defaults to 100',
          type: 'number',
        },
        atomic: {
          group: 'Command Options:',
          describe:
            'Automatically filters out artifacts that occur when using editors that use "atomic writes" instead of writing directly to the source file. Default to true, if `useFsEvents` and `usePolling` are `false',
          type: 'boolean',
        },
        depth: {
          group: 'Command Options:',
          describe: 'If set, limits how many levels of subdirectories will be traversed, defaults to undefined.',
          type: 'number',
        },
        'disable-globbing': {
          group: 'Command Options:',
          describe:
            'If set to true then the strings passed to .watch() and .add() are treated as literal path names, even if they look like globs, defaults to false.',
          type: 'boolean',
        },
        'follow-symlinks': {
          group: 'Command Options:',
          describe: `When false, only the symlinks themselves will be watched for changes instead of following the link references and bubbling events through the link's path.`,
          type: 'boolean',
        },
        ignored: {
          group: 'Command Options:',
          describe:
            'Defines files/paths to be ignored, it can be a string or an array of string (anymatch-compatible definition)',
          // type must remain ambiguous because it is overloaded (string _or_ array of string)
        },
        'ignore-initial': {
          group: 'Command Options:',
          describe:
            'If set to false then add/addDir events are also emitted for matching paths while instantiating the watching as chokidar discovers these file paths (before the ready event), defaults to true',
          type: 'boolean',
        },
        'ignore-permission-errors': {
          group: 'Command Options:',
          describe: `Indicates whether to watch files that don't have read permissions if possible, defaults to true`,
          type: 'boolean',
        },
        interval: {
          group: 'Command Options:',
          describe: `Interval of file system polling, in milliseconds. You may also set the CHOKIDAR_INTERVAL env variable to override this option, defaults to 100.`,
          type: 'number',
        },
        'use-polling': {
          group: 'Command Options:',
          describe: `Whether to use fs.watchFile (backed by polling), or fs.watch. If polling leads to high CPU utilization, consider setting this to false, defaults to false.`,
          type: 'boolean',
        },
      })
      .middleware((args) => {
        const { '--': doubleDash } = args;
        if (doubleDash && Array.isArray(doubleDash)) {
          args.command = doubleDash.join(' ');
        }
      }, true);

    return filterOptions(yargs);
  },

  handler: async (argv: WatchCommandOption) => {
    try {
      // @ts-ignore
      const { WatchCommand } = await import('@lerna-lite/watch');
      return new WatchCommand(argv);
    } catch (err: any) {
      throw new Error(
        `"@lerna-lite/watch" is optional and was not found. Please install it with "npm install @lerna-lite/watch -D". ${err}`
      );
    }
  },
};

// cli-nano pilot config for this command
export const cliNanoConfig = {
  command: { name: 'watch', positionals: [] as any[] },
  options: {
    command: { type: 'string' },
    'no-bail': { type: 'boolean' },
    bail: { type: 'boolean' },
    'no-shell': { type: 'boolean' },
    shell: { type: 'boolean', default: true },
    debounce: { type: 'number' },
    'file-delimiter': { type: 'string' },
    glob: { type: 'string' },
    'no-prefix': { type: 'boolean' },
    prefix: { type: 'boolean' },
    stream: { type: 'boolean' },
    'await-write-finish': { type: 'boolean' },
    'awf-stability-threshold': { type: 'number' },
    'awf-poll-interval': { type: 'number' },
    atomic: { type: 'boolean' },
    depth: { type: 'number' },
    'disable-globbing': { type: 'boolean' },
    'follow-symlinks': { type: 'boolean' },
    ignored: { type: 'string' },
    'ignore-initial': { type: 'boolean' },
    'ignore-permission-errors': { type: 'boolean' },
    interval: { type: 'number' },
    'use-polling': { type: 'boolean' },
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
  const parsed: any = parseSubcommand(cliNanoConfig as any, rawArgs, context);

  // yargs builder used a middleware to populate `args.command` from `--`;
  // mirror that behavior for the pilot so the command string is available.
  if (!parsed.command && Array.isArray(parsed['--']) && parsed['--'].length) {
    parsed.command = parsed['--'].join(' ');
  }

  return await (mod.handler as any)(parsed as WatchCommandOption);
}
