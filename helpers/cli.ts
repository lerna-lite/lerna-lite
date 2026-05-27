import { resolve as pathResolve } from 'node:path';

import * as cliNano from 'cli-nano';
import { x } from 'tinyexec';

// prefer the built CLI when available, but tests may run against source
// so dynamically import the dist entry and fall back to the src entry.
import { parseSubcommand } from '../packages/cli/src/yargs-compat.js';

const LERNA_BIN = pathResolve(import.meta.dirname, '../packages/cli/src/cli.ts');

/**
 * A higher-order function to help with passing _actual_ yargs-parsed argv
 * into command constructors (instead of artificial direct parameters).
 *
 * @param {Object} commandModule The yargs command exports
 * @return {Function} with partially-applied yargs config
 */
export function commandRunner(commandModule: any) {
  const cmd = commandModule.command.split(' ')[0];

  return (cwd: string) => {
    // create a _new_ yargs instance every time cwd changes to avoid singleton pollution
    // lazily import the compiled CLI when available, otherwise use the source
    // implementation so tests don't require a prior `build` step.
    return (...args: string[]) =>
      new Promise(async (resolve, reject) => {
        let lernaCLI: any;
        try {
          const mod = await import('../packages/cli/dist/lerna-cli.js');
          lernaCLI = mod.default;
        } catch (e) {
          const mod = await import('../packages/cli/src/lerna-cli.js');
          lernaCLI = mod.default;
        }

        const cli = lernaCLI([], cwd)
          .exitProcess(false)
          .detectLocale(false)
          .showHelpOnFail(false)
          .wrap(null)
          .command(commandModule);

        const yargsMeta: any = {};
        const context = {
          cwd,
          lernaVersion: '__TEST_VERSION__',
          loglevel: 'silent',
          progress: false,
          onResolved: (result) => {
            // success resolves the result, if any, returned from execute()
            resolve(Object.assign({}, result, yargsMeta));
          },
          onRejected: (result) => {
            Object.assign(result, yargsMeta);
            // tests expect errors thrown to indicate failure,
            // _not_ just non-zero exitCode
            reject(result);
          },
        };

        const parseFn = (_yargsError: Error | undefined, parsedArgv: any, yargsOutput: string) => {
          // this is synchronous, before the async handlers resolve
          Object.assign(yargsMeta, { parsedArgv, yargsOutput });
        };

        // If the command module exposes a pilot `runWithCliNano` runner, prefer
        // to use it for tests. This allows incremental migration to cli-nano.
        if (typeof commandModule.runWithCliNano === 'function') {
          try {
            // parse args with cli-nano for metadata if a config is available
            if (commandModule.cliNanoConfig) {
              try {
                // prefer the shared helper so command name injection and
                // normalization match what pilots receive when executed.
                try {
                  const parsed = parseSubcommand(commandModule.cliNanoConfig, args as any[]);
                  yargsMeta.parsedArgv = parsed;
                } catch (e) {
                  // fallback to cli-nano.parseArgs if helper isn't usable
                  const originalArgv = process.argv;
                  try {
                    // Strip explicit empty-string tokens so cli-nano treats them
                    // as absent (matching yargs historical behavior).
                    const sanitizedArgs = Array.isArray(args)
                      ? args.filter((a) => a !== '' && a !== undefined && a !== null)
                      : args;
                    process.argv = [process.argv[0], process.argv[1], ...(sanitizedArgs as string[])];
                    const parsed = (cliNano as any).parseArgs(commandModule.cliNanoConfig);
                    yargsMeta.parsedArgv = parsed;
                  } finally {
                    process.argv = originalArgv;
                  }
                }
              } catch (e) {
                // ignore parse errors here; fall back to default behavior
              }
            }

            const res = await commandModule.runWithCliNano(args, context);
            context.onResolved(res);
            return;
          } catch (err: any) {
            // emulate yargs.fail handling: attach exitCode if present
            const actual = err as Error & { exitCode?: number };
            yargsMeta.exitCode = 'exitCode' in actual ? actual.exitCode : 1;
            context.onRejected(actual);
            return;
          }
        }

        await cli
          .fail((msg: string, err: Error) => {
            // since yargs 10.1.0, this is the only way to catch handler rejection
            // _and_ yargs validation exceptions when using async command handlers
            const actual = (err || new Error(msg)) as Error & { exitCode: number };
            // backfill exitCode for test convenience
            yargsMeta.exitCode = 'exitCode' in actual ? actual.exitCode : 1;
            context.onRejected(actual);
          })
          .parse([cmd, ...args], context, parseFn);
      });
  };
}

export function cliRunner(cwd: string, env: { [key: string]: string }) {
  const nodeOptions = {
    cwd,
    env: {
      CI: 'true',
      NO_COLOR: 'true', // disable colors for easier snapshot testing
      ...env,
    },
  };

  /**
   * We return x() which is Promise-like.
   * Note: If your integration tests expect this to reject on non-zero exit,
   * you may need to wrap this call with your custom wrapError helper
   * from child-process.ts.
   */
  return (...args: string[]) => x('node', [LERNA_BIN, ...args], { nodeOptions });
}
