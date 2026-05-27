import type { RunCommandOption } from '@lerna-lite/core';

import { filterOptions } from '../filter-options.js';
import { parseSubcommand } from '../yargs-compat.js';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
const mod = {
  command: 'run <script>',
  describe: 'Run an npm script in each package that contains that script',
  builder: (yargs: any) => {
    yargs
      .example('$0 run build -- --silent', '# `npm run build --silent` in all packages with a build script')
      .parserConfiguration({
        'populate--': true,
      })
      .positional('script', {
        describe: 'The npm script to run. Pass flags to send to the npm client after --',
        type: 'string',
      })
      .options({
        'aggregate-output': {
          group: 'Command Options:',
          describe: "Aggregate output from parallel child processes. Use 'failures-only' to only print failed packages.",
          type: 'string',
        },
        'dry-run': {
          group: 'Command Options:',
          describe: 'Displays the process command that would be performed without executing it.',
          type: 'boolean',
        },
        'npm-client': {
          group: 'Command Options:',
          describe: 'Executable used to run scripts (npm, yarn, pnpm, ...).',
          defaultDescription: 'npm',
          type: 'string',
          requiresArg: true,
        },
        stream: {
          group: 'Command Options:',
          describe: 'Stream output with lines prefixed by package.',
          type: 'boolean',
        },
        parallel: {
          group: 'Command Options:',
          describe: 'Run script with unlimited concurrency, streaming prefixed output.',
          type: 'boolean',
        },
        'no-bail': {
          group: 'Command Options:',
          describe: 'Continue running script despite non-zero exit in a given package.',
          type: 'boolean',
        },
        bail: {
          // proxy for --no-bail
          hidden: true,
          type: 'boolean',
        },
        // This option controls prefix for stream output so that it can be disabled to be friendly
        // to tools like Visual Studio Code to highlight the raw results
        'no-prefix': {
          group: 'Command Options:',
          describe: 'Do not prefix streaming output.',
          type: 'boolean',
        },
        prefix: {
          // proxy for --no-prefix
          hidden: true,
          type: 'boolean',
        },
        profile: {
          group: 'Command Options:',
          describe: 'Profile script executions and output performance profile to default location.',
          type: 'boolean',
        },
        'profile-location': {
          group: 'Command Options:',
          describe: 'Output performance profile to custom location instead of default project root.',
          type: 'string',
        },
      });

    return filterOptions(yargs);
  },

  handler: async (argv: RunCommandOption) => {
    try {
      // @ts-ignore
      const { RunCommand } = await import('@lerna-lite/run');
      return new RunCommand(argv);
    } catch (err: any) {
      throw new Error(
        `"@lerna-lite/run" is optional and was not found. Please install it with "npm install @lerna-lite/run -D". ${err}`
      );
    }
  },
};

// cli-nano pilot config for this command
export const cliNanoConfig = {
  command: { name: 'run', positionals: [{ name: 'script', type: 'string' }] as any[] },
  options: {
    'aggregate-output': { type: 'string' },
    'dry-run': { type: 'boolean' },
    'npm-client': { type: 'string' },
    stream: { type: 'boolean' },
    parallel: { type: 'boolean' },
    'no-bail': { type: 'boolean' },
    bail: { type: 'boolean' },
    'no-prefix': { type: 'boolean' },
    prefix: { type: 'boolean' },
    profile: { type: 'boolean' },
    'profile-location': { type: 'string' },
    // filterOptions
    scope: { type: 'string' },
    ignore: { type: 'string' },
    'no-private': { type: 'boolean' },
    private: { type: 'boolean' },
    since: { type: 'string' },
    'exclude-dependents': { type: 'boolean' },
    'include-dependents': { type: 'boolean' },
    'include-dependencies': { type: 'boolean' },
    'include-merged-tags': { type: 'boolean' },
    'continue-if-no-match': { type: 'boolean' },
  },
} as const;

// attach pilots to the module export
(mod as any).runWithCliNano = runWithCliNano;
(mod as any).cliNanoConfig = cliNanoConfig;

export default mod;

// Pilot runner: parse with cli-nano and call existing handler
export async function runWithCliNano(rawArgs?: string[], context?: any) {
  let parsed: any;
  try {
    parsed = parseSubcommand(cliNanoConfig as any, rawArgs, context);
    // If cli-nano injected the subcommand token and populated the named
    // positional `script` with that token (e.g. `script: 'run'`) while
    // there were no user-supplied positionals or passthrough args, treat
    // the positional as absent so the handler performs its own validation.
    try {
      const injectedCmd = (cliNanoConfig.command as any)?.name;
      if (
        injectedCmd &&
        parsed &&
        parsed.script === injectedCmd &&
        Array.isArray(parsed._) &&
        parsed._.length === 0 &&
        (!Array.isArray(parsed['--']) || parsed['--'].length === 0)
      ) {
        delete parsed.script;
      }
    } catch (e) {
      /* ignore */
    }
  } catch (err) {
    // Fall back to a minimal positional mapping when cli-nano validation
    // rejects the argv (e.g. Unknown argument). This allows the command
    // handler to run and perform its own validation/error messages.
    const expanded = Array.isArray(rawArgs) ? rawArgs.slice() : [];
    parsed = { _: expanded.slice(), __rawArgs: expanded.slice(), '--': [] };
    // rudimentary option extraction for boolean and string options so
    // fallback still preserves flags like `--dry-run` for handlers
    try {
      const opts = (cliNanoConfig as any).options || {};
      for (const optKey of Object.keys(opts)) {
        const opt = opts[optKey] || {};
        const kebab = `--${optKey}`;
        const noKebab = `--no-${optKey}`;

        if (opt.type === 'boolean') {
          if (
            expanded.indexOf(kebab) !== -1 ||
            expanded.some((e: string) => typeof e === 'string' && e.indexOf(`${kebab}=`) === 0)
          ) {
            parsed[optKey] = true;
          } else if (
            expanded.indexOf(noKebab) !== -1 ||
            expanded.some((e: string) => typeof e === 'string' && e.indexOf(`${noKebab}=`) === 0)
          ) {
            parsed[optKey] = false;
          }
        } else if (opt.type === 'string') {
          // handle --opt=value or --opt value
          const foundEq = expanded.find((e: string) => typeof e === 'string' && e.indexOf(`${kebab}=`) === 0);
          if (foundEq) {
            parsed[optKey] = foundEq.split('=')[1];
          } else {
            const idx = expanded.indexOf(kebab);
            if (idx !== -1 && expanded[idx + 1] && typeof expanded[idx + 1] === 'string' && !expanded[idx + 1].startsWith('-')) {
              parsed[optKey] = expanded[idx + 1];
            }
          }
        }

        // camelCase alias copy
        const camel = optKey.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
        if (Object.prototype.hasOwnProperty.call(parsed, optKey) && parsed[optKey] !== undefined) parsed[camel] = parsed[optKey];
        if (Object.prototype.hasOwnProperty.call(parsed, camel) && parsed[camel] !== undefined) parsed[optKey] = parsed[camel];
      }

      // detect passthrough `--` args
      const dd = expanded.indexOf('--');
      if (dd !== -1) {
        parsed['--'] = expanded.slice(dd + 1);
        // also strip the command token from __rawArgs if present at front
        if (parsed.__rawArgs && parsed.__rawArgs[0] === (cliNanoConfig.command as any)?.name) parsed.__rawArgs.shift();
      }
    } catch (e) {
      /* ignore fallback extraction errors */
    }
    // map positionals from cliNanoConfig if present
    const pos = (cliNanoConfig.command as any)?.positionals || [];
    for (let i = 0; i < pos.length; i++) {
      const name = pos[i].name;
      if (pos[i].variadic) {
        parsed[name] = parsed._.slice(i);
        break;
      }
      if (parsed._[i] !== undefined) parsed[name] = parsed._[i];
    }
    if (context && typeof context === 'object') {
      for (const [k, v] of Object.entries(context)) {
        if (k === 'onResolved' || k === 'onRejected') parsed[k] = v;
        else if (parsed[k] === undefined) parsed[k] = v;
      }
    }
  }

  return await (mod.handler as any)(parsed as RunCommandOption);
}
