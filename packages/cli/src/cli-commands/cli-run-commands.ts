import { RunCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
export default {
  command: 'run <script>',
  describe: 'Run an npm script in each package that contains that script',
  builder: (yargs: any) => {
    yargs
      .example('$0 run build -- --silent', '# `npm run build --silent` in all packages with a build script')
      .parserConfiguration({
        'populate--': true,
      })
      .positional('script', {
        describe: 'The npm script to run. Pass flags to send to the npm client after --',
        type: 'string',
      })
      .options({
        'dry-run': {
          group: 'Command Options:',
          describe: 'Displays the process command that would be performed without executing it.',
          type: 'boolean',
        },
        'npm-client': {
          group: 'Command Options:',
          describe: 'Executable used to run scripts (npm, yarn, pnpm, ...).',
          defaultDescription: 'npm',
          type: 'string',
          requiresArg: true,
        },
        stream: {
          group: 'Command Options:',
          describe: 'Stream output with lines prefixed by package.',
          type: 'boolean',
        },
        parallel: {
          group: 'Command Options:',
          describe: 'Run script with unlimited concurrency, streaming prefixed output.',
          type: 'boolean',
        },
        'no-bail': {
          group: 'Command Options:',
          describe: 'Continue running script despite non-zero exit in a given package.',
          type: 'boolean',
        },
        bail: {
          // proxy for --no-bail
          hidden: true,
          type: 'boolean',
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
          describe: 'Profile script executions and output performance profile to default location.',
          type: 'boolean',
        },
        'profile-location': {
          group: 'Command Options:',
          describe: 'Output performance profile to custom location instead of default project root.',
          type: 'string',
        },
        'skip-nx-cache': {
          hidden: true,
          type: 'boolean',
        },
        'load-env-files': {
          group: 'Command Options:',
          describe: 'When useNx is enabled, do we want to automatically load .env files',
          type: 'boolean',
        },
        'use-nx': {
          group: 'Command Options:',
          describe:
            '(deprecated) Enables integration with Nx instead of the default Lerna task runner (which uses `p-map` and `p-queue`).',
          type: 'boolean',
        },
        verbose: {
          group: 'Command Options:',
          describe: 'When "useNx" is true, show verbose output from dependent tasks.',
          type: 'boolean',
        },
      });

    return filterOptions(yargs);
  },

  handler: async (argv: RunCommandOption) => {
    try {
      // @ts-ignore
      // eslint-disable-next-line
      const { RunCommand } = await import('@lerna-lite/run');
      new RunCommand(argv);
    } catch (err: unknown) {
      console.error(
        `"@lerna-lite/run" is optional and was not found. Please install it with "npm install @lerna-lite/run -D -W".`,
        err
      );
    }
  },
};
