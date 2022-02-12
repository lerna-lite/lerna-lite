#!/usr/bin/env node

import 'dotenv/config';
import dedent from 'dedent';
import log from 'npmlog';
import yargs from 'yargs/yargs';
import { PublishCommand } from '@lerna-lite/publish';
import { VersionCommand } from '@lerna-lite/version';
import { publishCommandOptions } from './publishCommandOptions';
import { versionCommandOptions } from './versionCommandOptions';

function logCliVersion() {
  const pkg = require('../package.json');
  log.notice('cli', `version ${pkg?.version ?? ''}`);
}

function publishHandler(argv: any) {
  logCliVersion();
  new PublishCommand(argv);
}

function versionHandler(argv: any) {
  logCliVersion();
  new VersionCommand(argv);
}

const cli = yargs(process.argv, process.cwd());

yargs(process.argv.slice(2))
  .example('$0 version build -- --silent', '# `npm version build --silent` in all packages with a build script')
  .command({
    command: 'publish [script]',
    describe: 'publish a new version',
    handler: publishHandler,
  })
  .command({
    command: 'version [script]',
    describe: 'roll a new version',
    handler: versionHandler,
  })
  .parserConfiguration({
    'populate--': true,
  })
  .positional('script', {
    describe: 'The npm script to run. Pass flags to send to the npm client after --',
    type: 'string',
  })
  .options({ ...versionCommandOptions, ...publishCommandOptions } as any)
  .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
  .usage('Usage: $0 <command> [options]')
  .recommendCommands()
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
    For more information, find our manual at https://github.com/ghiscoding/lerna-lite
  `)
  .argv;

