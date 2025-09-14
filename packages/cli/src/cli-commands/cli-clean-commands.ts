import type { CleanCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
export default {
  command: 'clean',
  describe: 'Remove the node_modules directory from all packages',
  builder: (yargs: any) => {
    yargs
      .example('$0 clean --yes', '# clean the packages without confirmation prompt')
      .example('$0 clean --scope=$LERNA_PACKAGE_NAME', '# clean the package filtered by scope')
      .parserConfiguration({
        'populate--': true,
        'strip-dashed': true,
      })
      .option('command', { type: 'string', hidden: true })
      .options({
        'dry-run': {
          describe: 'Displays the process command that would be performed without executing it.',
          group: 'Command Options:',
          type: 'boolean',
        },
        y: {
          group: 'Command Options:',
          describe: 'Skip all confirmation prompts',
          alias: 'yes',
          type: 'boolean',
        },
      });
    return filterOptions(yargs);
  },
  handler: async (argv: CleanCommandOption) => {
    try {
      // @ts-ignore
      const { CleanCommand } = await import('@lerna-lite/clean');
      new CleanCommand(argv);
    } catch (err: unknown) {
      throw new Error(
        `"@lerna-lite/clean" is optional and was not found. Please install it with "npm install @lerna-lite/clean -D". ${err}`
      );
    }
  },
};
