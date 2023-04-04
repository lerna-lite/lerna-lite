import { loadJsonFileSync } from 'load-json-file';
import path from 'path';
import { JsonValue } from '@lerna-lite/core';
import { fileURLToPath } from 'url';

import changedCmd from './cli-commands/cli-changed-commands.js';
import diffCmd from './cli-commands/cli-diff-commands.js';
import execCmd from './cli-commands/cli-exec-commands.js';
import initCmd from './cli-commands/cli-init-commands.js';
import listCmd from './cli-commands/cli-list-commands.js';
import publishCmd from './cli-commands/cli-publish-commands.js';
import runCmd from './cli-commands/cli-run-commands.js';
import versionCmd from './cli-commands/cli-version-commands.js';
import watchCmd from './cli-commands/cli-watch-commands.js';
import cli from './lerna-cli.js';

export function lerna(argv: any[]) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const cliPkg = loadJsonFileSync<{ [dep: string]: JsonValue }>(path.join(__dirname, '../', 'package.json'));
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
