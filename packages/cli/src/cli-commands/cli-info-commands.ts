import { InfoCommand } from '@lerna-lite/info';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = 'info';
exports.describe = 'Prints debugging information about the local environment';

exports.handler = function handler(argv) {
  return new InfoCommand(argv);
};
