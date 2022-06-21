import { listable } from '@lerna-lite/listable';

import { filterOptions } from '../filter-options';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = 'list';
exports.aliases = ['ls', 'la', 'll'];
exports.describe = 'List local packages';

exports.builder = (yargs) => {
  listable.options(yargs);

  return filterOptions(yargs);
};

exports.handler = async function handler(argv) {
  try {
    // @ts-ignore
    // eslint-disable-next-line import/no-unresolved
    const { ListCommand } = await import('@lerna-lite/list');
    new ListCommand(argv);
  } catch (e) {
    console.error(
      '"@lerna-lite/list" is optional and was not found. Please install it with `npm install @lerna-lite/list -D -W`'
    );
  }
};
