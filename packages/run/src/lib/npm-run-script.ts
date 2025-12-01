import type { Package } from '@lerna-lite/core';
import { execPackageManager, spawnStreaming } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';

import type { RunScriptOption, ScriptStreamingOption } from '../interfaces.js';
import { getNpmExecOpts } from './get-npm-exec-opts.js';

export function npmRunScript(script: string, { args, npmClient, pkg, reject = true }: RunScriptOption, dryRun = false) {
  log.silly('npmRunScript', script, args, pkg.name);

  const argv = ['run', script, ...args];
  const opts = makeOpts(pkg, reject);

  return execPackageManager(npmClient, argv, opts, dryRun);
}

export function npmRunScriptStreaming(
  script: string,
  { args, npmClient, pkg, prefix, reject = true }: ScriptStreamingOption,
  dryRun = false
) {
  log.silly('npmRunScriptStreaming', JSON.stringify([script, args, pkg.name]));

  const argv = ['run', script, ...args];
  const opts = makeOpts(pkg, reject);

  return spawnStreaming(npmClient, argv, opts, prefix && pkg.name, dryRun);
}

function makeOpts(pkg: Package, reject: boolean) {
  return Object.assign(getNpmExecOpts(pkg), {
    windowsHide: false,
    reject,
  });
}
