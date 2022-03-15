const cli = require('./lerna-cli');
const pkg = require('../package.json');

const publishCmd = require('./cli-commands/cli-publish-commands');
const runCmd = require('./cli-commands/cli-run-commands');
const versionCmd = require('./cli-commands/cli-version-commands');

export function lerna(argv: any[]) {
  const context = {
    lernaVersion: pkg.version,
  };

  return cli()
    .command(publishCmd)
    .command(runCmd)
    .command(versionCmd)
    .parse(argv, context);
}
