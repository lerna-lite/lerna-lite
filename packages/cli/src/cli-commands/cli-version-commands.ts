import type { VersionCommandOption } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

import { filterOptions } from '../filter-options.js';
import { parseSubcommand } from '../yargs-compat.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */

const addBumpPositionalFn = function (yargs: any, additionalKeywords: string[] = []) {
  const semverKeywords = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'].concat(additionalKeywords);
  const bumpOptionList = `'${semverKeywords.slice(0, -1).join(`', '`)}', or '${semverKeywords[semverKeywords.length - 1]}'.`;

  yargs.positional('bump', {
    describe: `Increment version(s) by explicit version _or_ semver keyword,\n${bumpOptionList}`,
    type: 'string',
  });
};
let addBumpPositional = addBumpPositionalFn;

// Handler for the version command (kept standalone now that CLI commands
// are fully migrated to cli-nano). Tests and the pilot runner call this
// directly.
export async function handler(argv: VersionCommandOption) {
  try {
    // @ts-ignore
    const { VersionCommand } = await import('@lerna-lite/version');
    return new VersionCommand(argv);
  } catch (err: any) {
    throw new Error(
      `"@lerna-lite/version" is optional and was not found. Please install it with "npm install @lerna-lite/version -D". ${err}`
    );
  }
}

// cli-nano pilot config for this command
export const cliNanoConfig = {
  command: { name: 'version', positionals: [{ name: 'bump', type: 'string' }] as any[] },
  options: {
    'allow-branch': { type: 'array' },
    'allow-peer-dependencies-update': { type: 'boolean' },
    amend: { type: 'boolean' },
    'build-metadata': { type: 'string' },
    'conventional-bump-prerelease': { type: 'boolean' },
    'conventional-commits': { type: 'boolean' },
    'conventional-graduate': { type: 'string' },
    'force-conventional-graduate': { type: 'boolean' },
    'conventional-prerelease': { type: 'string' },
    'changelog-header-message': { type: 'string' },
    'changelog-include-commits-git-author': { type: 'string' },
    'changelog-include-commits-client-login': { type: 'string' },
    'changelog-preset': { type: 'string' },
    'dry-run': { type: 'boolean' },
    exact: { type: 'boolean' },
    'exclude-dependents': { type: 'boolean' },
    'independent-subpackages': { type: 'boolean' },
    'force-publish': { type: 'string' },
    'git-remote': { type: 'string' },
    'create-release': { type: 'string' },
    'create-release-discussion': { type: 'string' },
    'generate-release-notes': { type: 'boolean' },
    'ignore-changes': { type: 'array' },
    'ignore-scripts': { type: 'boolean' },
    'include-merged-tags': { type: 'boolean' },
    m: { type: 'string', alias: 'message' },
    message: { type: 'string', alias: 'm' },
    'no-changelog': { type: 'boolean' },
    'no-commit-hooks': { type: 'boolean' },
    'commit-hooks': { type: 'boolean' },
    'git-tag-command': { type: 'string' },
    'no-git-tag-version': { type: 'boolean' },
    'tag-version-separator': { type: 'string' },
    'no-granular-pathspec': { type: 'boolean' },
    'granular-pathspec': { type: 'boolean' },
    'no-private': { type: 'boolean' },
    private: { type: 'boolean' },
    'no-push': { type: 'boolean' },
    push: { type: 'boolean' },
    'push-tags-one-by-one': { type: 'boolean' },
    preid: { type: 'string' },
    'remote-client': { type: 'string' },
    'release-footer-message': { type: 'string' },
    'release-header-message': { type: 'string' },
    'sign-git-commit': { type: 'boolean' },
    'signoff-git-commit': { type: 'boolean' },
    'sign-git-tag': { type: 'boolean' },
    'force-git-tag': { type: 'boolean' },
    'tag-version-prefix': { type: 'string' },
    'no-manually-update-root-lockfile': { type: 'boolean' },
    'manually-update-root-lockfile': { type: 'boolean' },
    'npm-client-args': { type: 'array' },
    'run-scripts-on-lockfile-update': { type: 'boolean' },
    'no-sync-workspace-lock': { type: 'boolean' },
    'sync-workspace-lock': { type: 'boolean' },
    'skip-bump-only-releases': { type: 'boolean' },
    'premajor-version-bump': { type: 'string' },
    y: { type: 'boolean' },
  },
} as const;

// Note: this module no longer exports a yargs `mod` default. The
// command is represented by the `cliNanoConfig` and `runWithCliNano`
// pilot; `handler` is provided for direct invocation.

// Provide a yargs-compatible module default for backward compatibility
// and tests that import the module as a command definition.
const mod = {
  command: 'version [bump]',
  describe: 'Bump version of packages and optionally create changelog entries',
  builder: (yargs: any, _cmd?: string) => {
    yargs.parserConfiguration({ 'populate--': true }).positional('bump', {
      describe: `Increment version(s) by explicit version _or_ semver keyword,\n'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'.`,
      type: 'string',
    });

    return filterOptions(yargs);
  },

  handler,
};

// attach pilots to the module export for compatibility with helpers
(mod as any).runWithCliNano = runWithCliNano;
(mod as any).cliNanoConfig = cliNanoConfig;

export default mod;

// Pilot runner: parse with cli-nano and call existing handler
export async function runWithCliNano(rawArgs?: string[], context?: any) {
  let parsed: any;
  try {
    parsed = parseSubcommand(cliNanoConfig as any, rawArgs, context);
  } catch (err) {
    // fallback: treat everything as positional and map bump
    const expanded = Array.isArray(rawArgs) ? rawArgs.slice() : [];
    parsed = { _: expanded.slice(), __rawArgs: expanded.slice(), '--': [] };
    try {
      // scan for --key=value or --key value patterns and populate parsed
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
            // skip next token as it's a value
            i++;
          }
        }

        if (key) {
          parsed[key] = val;
          const camel = key.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
          parsed[camel] = parsed[key];
        }
      }

      // map positionals from remaining _ tokens if any (skip any tokens that were options)
      const residual = parsed._.filter((t: string) => typeof t === 'string' && !t.startsWith('--'));
      const pos = (cliNanoConfig.command as any)?.positionals || [];
      for (let i = 0; i < pos.length; i++) {
        const name = pos[i].name;
        if (pos[i].variadic) {
          parsed[name] = residual.slice(i);
          break;
        }
        if (residual[i] !== undefined) parsed[name] = residual[i];
      }
      // detect passthrough `--` args
      const dd = expanded.indexOf('--');
      if (dd !== -1) {
        parsed['--'] = expanded.slice(dd + 1);
      }
    } catch (e) {
      /* ignore fallback extraction errors */
    }
    if (context && typeof context === 'object') {
      for (const [k, v] of Object.entries(context)) {
        if (k === 'onResolved' || k === 'onRejected') parsed[k] = v;
        else if (parsed[k] === undefined) parsed[k] = v;
      }
    }
  }

  try {
    // Defensive sanitization: ensure parsed._ contains only positional
    // tokens (no option-like strings). Some parser paths have left
    // flags in the positional array which downstream logic treats as
    // package specifiers; strip them here to preserve yargs semantics.
    if (parsed && Array.isArray(parsed._)) {
      parsed._ = parsed._.filter((t: any) => typeof t === 'string' && !t.startsWith('-'));
    }
    // Ensure --no-private sets the canonical positive form expected by VersionCommand
    if (parsed && (parsed['no-private'] === true || parsed.noPrivate === true)) {
      parsed.private = false;
    }
    // Mirror yargs check: warn when there are passthrough args after `--`
    try {
      if (Array.isArray(rawArgs) && rawArgs.indexOf('--') !== -1) {
        log.warn('EDOUBLEDASH', 'Arguments after -- are no longer passed to subprocess executions.');
        log.warn('EDOUBLEDASH', 'This will cause an error in a future major version.');
      }
    } catch (e) {
      /* ignore */
    }
    // debug logging removed
  } catch (e) {
    /* ignore */
  }

  return await handler(parsed as VersionCommandOption);
}

export { addBumpPositional };
