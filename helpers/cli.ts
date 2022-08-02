import execa from 'execa';
import path from 'path';

import lernaCLI from '../packages/cli/src/lerna-cli';

const LERNA_BIN = path.resolve(__dirname, '../packages/cli/src/cli.ts');

/**
 * A higher-order function to help with passing _actual_ yargs-parsed argv
 * into command constructors (instead of artificial direct parameters).
 *
 * @param {Object} commandModule The yargs command exports
 * @return {Function} with partially-applied yargs config
 */
export function commandRunner(commandModule: any) {
  /* eslint-disable import/no-dynamic-require, global-require */
  const cmd = commandModule.command.split(' ')[0];

  // prime the pump so slow-as-molasses CI doesn't fail with delayed require()
  require(path.resolve((require as any).main.filename, '../..'));

  return (cwd: string) => {
    // create a _new_ yargs instance every time cwd changes to avoid singleton pollution
    const cli = lernaCLI([], cwd)
      .exitProcess(false)
      .detectLocale(false)
      .showHelpOnFail(false)
      .wrap(null)
      .command(commandModule);

    return (...args: string[]) =>
      new Promise((resolve, reject) => {
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

        cli
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

exports.cliRunner = function cliRunner(cwd: string, env: { [key: string]: string }) {
  const opts = {
    cwd,
    env: Object.assign(
      {
        CI: 'true',
        // always turn off chalk
        FORCE_COLOR: '0',
      },
      env
    ),
    // when debugging integration test snapshots, uncomment next line
    // stdio: ["ignore", "inherit", "inherit"],
  };

  return (...args: string[]) => execa('node', [LERNA_BIN].concat(args), opts);
};
