import { existsSync } from 'node:fs';

import { log } from '@lerna-lite/npmlog';
import { removeSync } from 'remove-glob';

export function removeDir(deletePath: string, dryRun = false) {
  log.silly('removeDir', deletePath);

  // Short-circuit if we don't have anything to do.
  if (!existsSync(deletePath)) {
    return;
  }

  const isSuccessful = removeSync({ paths: deletePath, dryRun, verbose: true, stat: true });
  if (!isSuccessful) {
    throw new Error(`Failed to fully remove ${deletePath}`);
  }
  log.verbose('removeDir', 'removed', deletePath);
}
