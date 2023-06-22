import { CreateCommandOption } from '@lerna-lite/core';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
export default {
  command: 'create <name> [loc]',
  describe: 'Create a new lerna-managed package',
  builder: (yargs) => {
    yargs
      .example('$0 create pkg-1', '# creates a new lerna-managed package')
      .example('$0 create pkg-1 modules', '# creates a new lerna-managed package located in the "modules" locationfolder')
      .positional('name', {
        describe: 'The package name (including scope), which must be locally unique _and_ publicly available',
        type: 'string',
      })
      .positional('loc', {
        describe: 'A custom package location, defaulting to the first configured package location',
        type: 'string',
      })
      .options({
        access: {
          group: 'Command Options:',
          defaultDescription: 'public',
          describe: 'When using a scope, set publishConfig.access value',
          choices: ['public', 'restricted'],
        },
        bin: {
          group: 'Command Options:',
          defaultDescription: '<name>',
          describe: 'Package has an executable. Customize with --bin <executableName>',
        },
        description: {
          group: 'Command Options:',
          describe: 'Package description',
          type: 'string',
        },
        dependencies: {
          group: 'Command Options:',
          describe: 'A list of package dependencies',
          type: 'array',
        },
        'es-module': {
          group: 'Command Options:',
          describe: 'Initialize a transpiled ES Module',
          type: 'boolean',
        },
        homepage: {
          group: 'Command Options:',
          describe: 'The package homepage, defaulting to a subpath of the root pkg.homepage',
          type: 'string',
        },
        keywords: {
          group: 'Command Options:',
          describe: 'A list of package keywords',
          type: 'array',
        },
        license: {
          group: 'Command Options:',
          defaultDescription: 'ISC',
          describe: 'The desired package license (SPDX identifier)',
          type: 'string',
        },
        private: {
          group: 'Command Options:',
          describe: 'Make the new package private, never published to any external registry',
          type: 'boolean',
        },
        registry: {
          group: 'Command Options:',
          describe: "Configure the package's publishConfig.registry",
          type: 'string',
        },
        tag: {
          group: 'Command Options:',
          describe: "Configure the package's publishConfig.tag",
          type: 'string',
        },
        y: {
          group: 'Command Options:',
          describe: 'Skip all prompts, accepting default values',
          alias: 'yes',
          type: 'boolean',
        },
      });

    return yargs;
  },

  handler: async (argv: CreateCommandOption) => {
    try {
      // @ts-ignore
      // eslint-disable-next-line
      const { CreateCommand } = await import('@lerna-lite/create');
      new CreateCommand(argv);
    } catch (err: unknown) {
      console.error(
        `"@lerna-lite/create" is optional and was not found. Please install it with "npm install @lerna-lite/create -D".`,
        err
      );
    }
  },
};
