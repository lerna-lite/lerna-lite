import log from 'npmlog';
import { exec, Package, spawnStreaming } from '@lerna-lite/core';

import { getNpmExecOpts } from './get-npm-exec-opts.js';
import { RunScriptOption, ScriptStreamingOption } from '../models/index.js';

export function npmRunScript(script: string, { args, npmClient, pkg, reject = true }: RunScriptOption, dryRun = false) {
  log.silly('npmRunScript', script, args, pkg.name);

  const argv = ['run', script, ...args];
  const opts = makeOpts(pkg, reject);

  return exec(npmClient, argv, opts, dryRun);
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
