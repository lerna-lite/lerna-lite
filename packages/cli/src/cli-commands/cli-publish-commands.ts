import type { PublishCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options.js';
import cliVersionCmd, { addBumpPositional } from './cli-version-commands.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */

function composeVersionOptions(yargs: any) {
  addBumpPositional(yargs, ['from-git', 'from-package']);
  cliVersionCmd.builder(yargs, 'publish');

  return yargs;
}

export default {
  command: 'publish [bump]',
  describe: 'Publish packages in the current project.',
  builder: (yargs: any) => {
    const opts = {
      c: {
        describe: 'Publish packages after every successful merge using the sha as part of the tag.',
        alias: 'canary',
        type: 'boolean',
      },
      // preid is copied from ../version/command because a whitelist for one option isn't worth it
      preid: {
        describe: 'Specify the prerelease identifier when publishing a prerelease',
        type: 'string',
        requiresArg: true,
        defaultDescription: 'alpha',
      },
      'cleanup-temp-files': {
        describe: 'Cleanup packed temp files/folders after publish process is finished, defaults to false.',
        type: 'boolean',
      },
      contents: {
        describe: 'Subdirectory to publish. Must apply to ALL packages.',
        type: 'string',
        requiresArg: true,
        defaultDescription: '.',
      },
      'dist-tag': {
        describe: 'Publish packages with the specified npm dist-tag',
        type: 'string',
        requiresArg: true,
      },
      'legacy-auth': {
        describe: 'Legacy Base64 Encoded username and password.',
        type: 'string',
      },
      'pre-dist-tag': {
        describe: 'Publish prerelease packages with the specified npm dist-tag',
        type: 'string',
        requiresArg: true,
      },
      'git-head': {
        describe: 'Explicit SHA to set as gitHead when packing tarballs, only allowed with "from-package" positional.',
        type: 'string',
        requiresArg: true,
      },
      'graph-type': {
        describe: 'Type of dependency to use when determining package hierarchy.',
        choices: ['all', 'dependencies'],
        defaultDescription: 'dependencies',
      },
      'ignore-prepublish': {
        describe: 'Disable deprecated "prepublish" lifecycle script',
        type: 'boolean',
      },
      'ignore-scripts': {
        describe: 'Disable all lifecycle scripts',
        type: 'boolean',
      },
      // TODO: (major) make --no-granular-pathspec the default
      'no-granular-pathspec': {
        describe: 'Do not reset changes file-by-file, but globally.',
        type: 'boolean',
      },
      'granular-pathspec': {
        // proxy for --no-granular-pathspec
        hidden: true,
        // describe: 'Reset changes file-by-file, not globally.',
        type: 'boolean',
      },
      otp: {
        describe: 'Supply a one-time password for publishing with two-factor authentication.',
        type: 'string',
        requiresArg: true,
      },
      'no-publish-config-overrides': {
        // proxy for --publish-config-overrides
        hidden: true,
        type: 'boolean',
      },
      'publish-config-overrides': {
        describe: 'apply publishConfig overrides.',
        type: 'boolean',
      },
      registry: {
        describe: 'Use the specified registry for all npm client operations.',
        type: 'string',
        requiresArg: true,
      },
      'remove-package-fields': {
        describe:
          '@deprecated: Remove fields from each package.json before publishing them to the registry, removing fields from a complex object is also supported via the dot notation (ie "scripts.build").',
        type: 'array',
      },
      'strip-package-keys': {
        describe:
          'Strip fields from each package.json before publishing them to the registry, removing fields from a complex object is also supported via the dot notation (ie "scripts.build").',
        type: 'array',
      },
      'no-git-reset': {
        describe: 'Do not reset changes to working tree after publishing is complete.',
        type: 'boolean',
      },
      'git-reset': {
        // proxy for --no-git-reset
        hidden: true,
        type: 'boolean',
      },
      'temp-tag': {
        describe: 'Create a temporary tag while publishing.',
        type: 'boolean',
      },
      'no-verify-access': {
        // proxy for --verify-access
        describe: 'Do not verify package read-write access for current npm user.',
        type: 'boolean',
      },
      'summary-file': {
        // generate lerna publish json output.
        describe:
          'Generate a json summary report after all packages have been successfully published, you can pass an optional path for where to save the file.',
        type: 'string',
      },
      throttle: {
        describe: 'Throttle module publication. This is implicit if a throttle size or delay is provided',
        type: 'boolean',
      },
      'throttle-size': {
        describe: 'Bucket size used to throttle module publication.',
        type: 'number',
      },
      'throttle-delay': {
        describe: 'Delay between throttle bucket items publications (in seconds).',
        type: 'number',
      },
      'verify-access': {
        describe: 'Verify package read-write access for current npm user.',
        type: 'boolean',
      },
    };

    composeVersionOptions(yargs);
    filterOptions(yargs);

    yargs.options(opts);

    // 'unhide' duplicate options
    const { hiddenOptions } = yargs.getOptions();
    const sharedKeys = ['preid', 'y', 'ignore-scripts'];

    for (const sharedKey of sharedKeys) {
      hiddenOptions.splice(
        hiddenOptions.findIndex((k) => k === sharedKey),
        1
      );
    }

    yargs.group(Object.keys(opts).concat(sharedKeys), 'Command Options:');

    return yargs;
  },

  handler: async (argv: PublishCommandOption) => {
    try {
      // @ts-ignore
      const { PublishCommand } = await import('@lerna-lite/publish');
      new PublishCommand(argv);
    } catch (err: unknown) {
      throw new Error(
        `"@lerna-lite/publish" is optional and was not found. Please install it with "npm install @lerna-lite/publish -D". ${err}`
      );
    }
  },
};
