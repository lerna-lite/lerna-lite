import { DiffCommandOption } from '@lerna-lite/core';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
export default {
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
      // eslint-disable-next-line import/no-unresolved
      const { DiffCommand } = await import('@lerna-lite/diff');
      new DiffCommand(argv);
    } catch (err: unknown) {
      console.error(
        `"@lerna-lite/diff" is optional and was not found. Please install it with "npm install @lerna-lite/diff -D -W".`,
        err
      );
    }
  },
};
