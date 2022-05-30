import { filterOptions } from '../filter-options';

/** @ts-ignore */
const group = 'Command Options:';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = 'list';
exports.describe = 'List local packages';
exports.aliases = ['ls', 'la', 'll'];

exports.builder = (yargs) => {
  yargs.options({
    json: {
      group,
      describe: 'Show information as a JSON array',
      type: 'boolean',
    },
    ndjson: {
      group,
      describe: 'Show information as newline-delimited JSON',
      type: 'boolean',
    },
    a: {
      group,
      describe: 'Show private packages that are normally hidden',
      type: 'boolean',
      alias: 'all',
    },
    l: {
      group,
      describe: 'Show extended information',
      type: 'boolean',
      alias: 'long',
    },
    p: {
      group,
      describe: 'Show parseable output instead of columnified view',
      type: 'boolean',
      alias: 'parseable',
    },
    toposort: {
      group,
      describe: 'Sort packages in topological order instead of lexical by directory',
      type: 'boolean',
    },
    graph: {
      group,
      describe: 'Show dependency graph as a JSON-formatted adjacency list',
      type: 'boolean',
    },
  });

  return filterOptions(yargs);
};

exports.handler = async function handler(argv) {
  try {
    const { ListCommand } = await import('@lerna-lite/list');
    new ListCommand(argv);
  } catch (e) {
    console.error(
      '"@lerna-lite/list" is optional and was not found. Please install it with `npm install @lerna-lite/list -D -W`'
    );
  }
};
