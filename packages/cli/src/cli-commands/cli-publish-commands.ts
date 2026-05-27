import type { PublishCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options.js';
import { parseSubcommand } from '../yargs-compat.js';
import cliVersionCmd, { addBumpPositional, cliNanoConfig as versionCliNanoConfig } from './cli-version-commands.js';

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
      return new PublishCommand(argv);
    } catch (err: any) {
      throw new Error(
        `"@lerna-lite/publish" is optional and was not found. Please install it with "npm install @lerna-lite/publish -D". ${err}`
      );
    }
  },
};

// Build a minimal cli-nano config for the publish pilot by extending
// the version command's cli-nano config with publish-specific options.
export const cliNanoConfig = {
  command: { name: 'publish', positionals: [{ name: 'bump', type: 'string' }] },
  options: Object.assign({}, (versionCliNanoConfig as any).options || {}, {
    c: { type: 'boolean' },
    preid: { type: 'string' },
    'cleanup-temp-files': { type: 'boolean' },
    contents: { type: 'string' },
    'dist-tag': { type: 'string' },
    'legacy-auth': { type: 'string' },
    'pre-dist-tag': { type: 'string' },
    'git-head': { type: 'string' },
    'graph-type': { type: 'string' },
    'ignore-prepublish': { type: 'boolean' },
    'ignore-scripts': { type: 'boolean' },
    'no-granular-pathspec': { type: 'boolean' },
    granularPathspec: { type: 'boolean' },
    otp: { type: 'string' },
    'no-publish-config-overrides': { type: 'boolean' },
    'publish-config-overrides': { type: 'boolean' },
    registry: { type: 'string' },
    'strip-package-keys': { type: 'array' },
    'no-git-reset': { type: 'boolean' },
    'git-reset': { type: 'boolean' },
    'temp-tag': { type: 'boolean' },
    'no-verify-access': { type: 'boolean' },
    'summary-file': { type: 'string' },
    throttle: { type: 'boolean' },
    'throttle-size': { type: 'number' },
    'throttle-delay': { type: 'number' },
    'verify-access': { type: 'boolean' },
  }),
} as const;

// Pilot runner: parse with cli-nano and call existing handler
export async function runWithCliNano(rawArgs?: string[], context?: any) {
  let parsed: any;
  try {
    parsed = parseSubcommand(cliNanoConfig as any, rawArgs, context);
  } catch (err) {
    // fallback: naive parsing similar to other pilots
    const expanded = Array.isArray(rawArgs) ? rawArgs.slice() : [];
    parsed = { _: expanded.slice(), __rawArgs: expanded.slice(), '--': [] };
    try {
      for (let i = 0; i < expanded.length; i++) {
        const token = expanded[i];
        if (typeof token !== 'string') continue;
        if (!token.startsWith('--')) continue;

        const eqIndex = token.indexOf('=');
        let key: string;
        let val: any = true;
        if (eqIndex !== -1) {
          key = token.slice(2, eqIndex);
          val = token.slice(eqIndex + 1);
        } else {
          key = token.slice(2);
          const next = expanded[i + 1];
          if (next !== undefined && typeof next === 'string' && !next.startsWith('-')) {
            val = next;
            i++;
          }
        }

        if (key) {
          parsed[key] = val;
          const camel = key.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
          parsed[camel] = parsed[key];
        }
      }

      const dd = expanded.indexOf('--');
      if (dd !== -1) parsed['--'] = expanded.slice(dd + 1);
    } catch (e) {
      /* ignore */
    }
    if (context && typeof context === 'object') {
      for (const [k, v] of Object.entries(context)) {
        if (k === 'onResolved' || k === 'onRejected') parsed[k] = v;
        else if (parsed[k] === undefined) parsed[k] = v;
      }
    }
  }

  try {
    if (parsed && Array.isArray(parsed._)) {
      parsed._ = parsed._.filter((t: any) => typeof t === 'string' && !t.startsWith('-'));
    }
  } catch (e) {
    /* ignore */
  }

  // Fallback: if positional `bump` wasn't mapped by parseSubcommand, copy from parsed._
  try {
    if ((parsed as any).bump === undefined && Array.isArray((parsed as any)._) && (parsed as any)._[0]) {
      (parsed as any).bump = (parsed as any)._[0];
    }
  } catch (e) {
    /* ignore */
  }

  // Coerce repeated values provided after a single `--strip-package-keys` token
  try {
    const raw = Array.isArray((parsed as any).__rawArgs) ? (parsed as any).__rawArgs : undefined;
    if (raw?.[0] === '--strip-package-keys') {
      const vals = raw.slice(1).filter((v: any) => typeof v === 'string' && !v.startsWith('-'));
      if (vals.length) {
        (parsed as any)['strip-package-keys'] = vals;
        (parsed as any).stripPackageKeys = vals;
        if (Array.isArray((parsed as any)._)) {
          (parsed as any)._ = (parsed as any)._.filter((t: any) => !vals.includes(t));
        }
      }
    }
  } catch (e) {
    /* ignore */
  }

  return await (exports.default as any).handler(parsed as PublishCommandOption);
}

// attach pilots to the module export
(exports.default as any).runWithCliNano = runWithCliNano;
(exports.default as any).cliNanoConfig = cliNanoConfig;
