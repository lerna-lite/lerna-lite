import { ListCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options.js';
import { listableOptions } from './listable/listable-options.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
export default {
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
      // eslint-disable-next-line
      const { ListCommand } = await import('@lerna-lite/list');
      new ListCommand(argv);
    } catch (err: unknown) {
      console.error(
        `"@lerna-lite/list" is optional and was not found. Please install it with "npm install @lerna-lite/list -D".`,
        err
      );
      throw err;
    }
  },
};
