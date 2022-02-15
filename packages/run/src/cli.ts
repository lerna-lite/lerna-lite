#!/usr/bin/env node

import 'dotenv/config';
import dedent from 'dedent';
import log from 'npmlog';
import yargs from 'yargs/yargs';

import { RunCommand } from './runCommand';

function handler(argv: any) {
  const pkg = require('../package.json');
  log.notice('cli', `version ${pkg?.version ?? ''}`);
  new RunCommand(argv);
}

const cli = yargs(process.argv, process.cwd());

yargs(process.argv.slice(2))
  .example('$0 run build -- --silent', '# `npm run build --silent` in all packages with a build script')
  .command({
    command: 'run <script>',
    describe: 'Run an npm script in each package that contains that script',
    handler,
  })
  .parserConfiguration({
    'populate--': true,
  })
  .positional('script', {
    describe: 'The npm script to run. Pass flags to send to the npm client after --',
    type: 'string',
  })
  .options({
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
    'run-dry-run': {
      group: 'Command Options:',
      describe: 'Displays the process command that would be performed without executing it.',
      type: 'boolean',
    },
  })
  .demandCommand()
  .help()
  .wrap(null)
  .fail((msg, err) => {
    // certain yargs validations throw strings :P
    const actual: any = err || new Error(msg);

    // ValidationErrors are already logged, as are package errors
    if (actual.name !== 'ValidationError' && !actual.pkg) {
      // the recommendCommands() message is too terse
      if (/Did you mean/.test(actual.message)) {
        log.error('lerna', `Unknown command "${(cli.parsed as any).argv._[0]}"`);
      }

      log.error('lerna', actual.message);
    }

    // exit non-zero so the CLI can be usefully chained
    cli.exit(actual.exitCode > 0 ? actual.exitCode : 1, actual);
  })
  .wrap(cli.terminalWidth()).epilogue(dedent`
    When a command fails, all logs are written to lerna-debug.log in the current working directory.
    For more information, find our manual at https://github.com/lerna/lerna
  `)
  .argv;
