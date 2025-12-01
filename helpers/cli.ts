import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { execa } from 'execa';

import lernaCLI from '../packages/cli/dist/lerna-cli.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LERNA_BIN = pathResolve(__dirname, '../packages/cli/src/cli.ts');

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
    const cli = lernaCLI([], cwd).exitProcess(false).detectLocale(false).showHelpOnFail(false).wrap(null).command(commandModule);

    return (...args: string[]) =>
      new Promise(async (resolve, reject) => {
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
  const opts = {
    cwd,
    env: Object.assign(
      {
        CI: 'true',
        // always turn off tinyrainbow
        NO_COLOR: true,
      },
      env
    ),
    // when debugging integration test snapshots, uncomment next line
    // stdio: ["ignore", "inherit", "inherit"],
  };

  return (...args: string[]) => execa('node', [LERNA_BIN].concat(args), opts);
}
