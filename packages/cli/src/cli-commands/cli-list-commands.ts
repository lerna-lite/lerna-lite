import { ListCommandOption } from '@lerna-lite/core';
import { listable } from '@lerna-lite/listable';

import { filterOptions } from '../filter-options';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
export default {
  command: 'list',
  aliases: ['ls', 'la', 'll'],
  describe: 'List local packages',
  builder: (yargs) => {
    listable.options(yargs);

    return filterOptions(yargs);
  },

  handler: async (argv: ListCommandOption) => {
    try {
      // @ts-ignore
      // eslint-disable-next-line import/no-unresolved
      const { ListCommand } = await import('@lerna-lite/list');
      new ListCommand(argv);
    } catch (err: unknown) {
      console.error(
        `"@lerna-lite/list" is optional and was not found. Please install it with "npm install @lerna-lite/list -D -W".`,
        err
      );
    }
  },
};
