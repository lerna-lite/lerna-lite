import type { TinyExecOptions } from '@lerna-lite/core';

import { exec, execSync } from '../child-process.js';
import type { Package } from '../package.js';
import { isCorepackEnabled } from './is-corepack-enabled.js';

function createCommandAndArgs(npmClient: string, args: string[]) {
  let command = npmClient;
  const commandArgs = args === undefined ? [] : [...args];

  if (isCorepackEnabled()) {
    commandArgs.unshift(command);
    command = 'corepack';
  }

  return { command, commandArgs };
}

// prettier-ignore
export function execPackageManager(npmClient: string, args: string[], opts?: TinyExecOptions & { pkg?: Package }, dryRun = false): Promise<any> {
  const { command, commandArgs } = createCommandAndArgs(npmClient, args);
  return exec(command, commandArgs, opts, dryRun);
}

export function execPackageManagerSync(npmClient: string, args: string[], opts?: TinyExecOptions, dryRun = false): string {
  const { command, commandArgs } = createCommandAndArgs(npmClient, args);
  return execSync(command, commandArgs, opts, dryRun);
}
