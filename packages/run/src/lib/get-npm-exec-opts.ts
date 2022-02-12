import { Package } from '@lerna-lite/core';
import log from 'npmlog';

export function getNpmExecOpts(pkg: Package, registry?: string) {
  // execa automatically extends process.env
  const env: { [key: string]: string } = {};

  if (registry) {
    env.npm_config_registry = registry;
  }

  log.silly('getNpmExecOpts', pkg.location, registry);
  return {
    cwd: pkg.location,
    env,
    pkg,
  };
}
