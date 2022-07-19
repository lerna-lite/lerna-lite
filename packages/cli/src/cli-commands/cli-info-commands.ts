import { InfoCommand } from '@lerna-lite/info';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
export default {
  command: 'info',
  describe: 'Prints debugging information about the local environment',
  handler: (argv: any) => {
    return new InfoCommand(argv);
  },
};
