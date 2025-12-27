import type { Package } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

export function getNpmExecOpts(pkg: Package) {
  // execa automatically extends process.env
  const env: { [key: string]: string } = {
    LERNA_PACKAGE_NAME: pkg.name,
  };

  log.silly('getNpmExecOpts', pkg.location);
  return {
    cwd: pkg.location,
    env,
    pkg,
  };
}