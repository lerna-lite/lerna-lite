import changedCmd from './cli-commands/cli-changed-commands';
import diffCmd from './cli-commands/cli-diff-commands';
import execCmd from './cli-commands/cli-exec-commands';
import initCmd from './cli-commands/cli-init-commands';
import infoCmd from './cli-commands/cli-info-commands';
import listCmd from './cli-commands/cli-list-commands';
import publishCmd from './cli-commands/cli-publish-commands';
import runCmd from './cli-commands/cli-run-commands';
import versionCmd from './cli-commands/cli-version-commands';
import cli from './lerna-cli';
const pkg = require('../package.json');

export function lerna(argv: any[]) {
  const context = {
    lernaVersion: pkg.version,
  };

  return cli()
    .command(changedCmd as any)
    .command(diffCmd as any)
    .command(execCmd as any)
    .command(infoCmd as any)
    .command(initCmd as any)
    .command(listCmd as any)
    .command(publishCmd as any)
    .command(runCmd as any)
    .command(versionCmd as any)
    .parse(argv, context);
}
