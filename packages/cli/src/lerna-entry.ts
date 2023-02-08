import loadJsonFile from 'load-json-file';
import path from 'path';
import { JsonValue } from '@lerna-lite/core';

import changedCmd from './cli-commands/cli-changed-commands';
import diffCmd from './cli-commands/cli-diff-commands';
import execCmd from './cli-commands/cli-exec-commands';
import initCmd from './cli-commands/cli-init-commands';
import listCmd from './cli-commands/cli-list-commands';
import publishCmd from './cli-commands/cli-publish-commands';
import runCmd from './cli-commands/cli-run-commands';
import versionCmd from './cli-commands/cli-version-commands';
import watchCmd from './cli-commands/cli-watch-commands';
import cli from './lerna-cli';

export function lerna(argv: any[]) {
  const cliPkg = loadJsonFile.sync<{ [dep: string]: JsonValue }>(path.join(__dirname, '../', 'package.json'));
  const context = {
    lernaVersion: (cliPkg?.version ?? '') as string,
  };

  return cli()
    .command(changedCmd as any)
    .command(diffCmd as any)
    .command(execCmd as any)
    .command(initCmd as any)
    .command(listCmd as any)
    .command(publishCmd as any)
    .command(runCmd as any)
    .command(versionCmd as any)
    .command(watchCmd as any)
    .parse(argv, context);
}
