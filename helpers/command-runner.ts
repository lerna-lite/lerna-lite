import yargs from 'yargs/yargs';

import { PublishCommand } from '../packages/publish/src/publishCommand';
import { VersionCommand } from '../packages/version/src/versionCommand';
import { RunCommand } from '../packages/run/src/runCommand';

export function commandRunner(cwd: string, commandType: 'run' | 'publish' | 'version' = 'run') {
  let command = '';
  let describe = '';
  let handler: any;

  switch (commandType) {
    case 'publish':
      command = 'publish [script]';
      describe = 'publish a new version';
      handler = (argv) => new PublishCommand(argv);
      break;
    case 'version':
      command = 'version [script]';
      describe = 'roll a new version';
      handler = (argv) => new VersionCommand(argv);
      break;
    case 'run':
      command = 'run <script>';
      describe = 'Run an npm script in each package that contains that script';
      handler = (argv) => new RunCommand(argv);
      break;
  }

  // create a _new_ yargs instance every time cwd changes to avoid singleton pollution
  const cli = yargs([], cwd)
    .exitProcess(false)
    .detectLocale(false)
    .showHelpOnFail(false)
    .wrap(null)
    .command({
      command,
      describe,
      handler,
    });

  return (...args) => new Promise((resolve, reject) => {
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

    const parseFn = (yargsError, parsedArgv, yargsOutput) => {
      // this is synchronous, before the async handlers resolve
      Object.assign(yargsMeta, { parsedArgv, yargsOutput });
    };

    cli
      .fail((msg, err) => {
        // since yargs 10.1.0, this is the only way to catch handler rejection
        // _and_ yargs validation exceptions when using async command handlers
        const actual: any = err || new Error(msg);
        // backfill exitCode for test convenience
        yargsMeta.exitCode = 'exitCode' in actual ? actual.exitCode : 1;
        context.onRejected(actual);
      })
      .parse(['run', ...args], context, parseFn);
  });
}
