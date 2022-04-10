import { Package } from '@lerna-lite/core';
import log from 'npmlog';

export function getNpmExecOpts(pkg: Package) {
  // execa automatically extends process.env
  const env: { [key: string]: string } = {};

  log.silly('getNpmExecOpts', pkg.location);
  return {
    cwd: pkg.location,
    env,
    pkg,
  };
}
