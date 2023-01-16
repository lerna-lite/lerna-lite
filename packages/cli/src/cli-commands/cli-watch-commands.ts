import { WatchCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
export default {
  command: 'watch',
  describe: 'Runs a command whenever packages or their dependents change.',
  builder: (yargs: any) => {
    yargs
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
        'emit-changes-threshold': {
          group: 'Command Options:',
          describe:
            'Time to wait in milliseconds before emitting all the file changes into a single event, defaults to 100',
          type: 'number',
        },
        'file-delimiter': {
          group: 'Command Options:',
          describe:
            'The delimiter that will be used to separete file when mutiple file changes are emitted by the watch, defaults to ";;"',
          type: 'string',
        },
        glob: {
          group: 'Command Options:',
          describe:
            'Glob pattern to define which file pattern to watch, note that this will be appended to the package file path being watched.',
          type: 'string',
        },
        'watch-added-file': {
          group: 'Command Options:',
          describe: 'When enabled it will also watch when a file is being added.',
          type: 'boolean',
        },
        'watch-added-dir': {
          group: 'Command Options:',
          describe: 'When enabled it will also watch when a directory is being added.',
          type: 'boolean',
        },
        'watch-removed-file': {
          group: 'Command Options:',
          describe: 'When enabled it will also watch when a file is being removed.',
          type: 'boolean',
        },
        'watch-removed-dir': {
          group: 'Command Options:',
          describe: 'When enabled it will also watch when a directory is being removed.',
          type: 'boolean',
        },

        // -- Chokidar options
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
          describe: 'Defines files/paths to be ignored',
          type: 'string',
        },
        'ignore-initial': {
          group: 'Command Options:',
          describe:
            'If set to false then add/addDir events are also emitted for matching paths while instantiating the watching as chokidar discovers these file paths (before the ready event), defaults to true',
          type: 'boolean',
        },
        'ignore-permission-errors': {
          group: 'Command Options:',
          describe: `Indicates whether to watch files that don't have read permissions if possible, defaults to false`,
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
          // eslint-disable-next-line no-param-reassign
          args.command = doubleDash.join(' ');
        }
      }, true);

    return filterOptions(yargs);
  },

  handler: async (argv: WatchCommandOption) => {
    try {
      // @ts-ignore
      // eslint-disable-next-line import/no-unresolved
      const { WatchCommand } = await import('@lerna-lite/watch');
      new WatchCommand(argv);
    } catch (err: unknown) {
      console.error(
        `"@lerna-lite/watch" is optional and was not found. Please install it with "npm install @lerna-lite/watch -D -W".`,
        err
      );
    }
  },
};
