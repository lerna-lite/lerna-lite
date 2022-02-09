import log from 'npmlog';
import { exec, spawnStreaming } from '@ws-conventional-version-roller/core';

import { getNpmExecOpts } from './get-npm-exec-opts';
import { ScriptStreamingOption } from '../models';

export function npmRunScript(script, { args, npmClient, pkg, reject = true }, cmdDryRun = false) {
  log.silly('npmRunScript', script, args, pkg.name);

  const argv = ['run', script, ...args];
  const opts = makeOpts(pkg, reject);

  return exec(npmClient, argv, opts, cmdDryRun);
}

export function npmRunScriptStreaming(script: string, { args, npmClient, pkg, prefix, reject = true }: ScriptStreamingOption, cmdDryRun = false) {
  log.silly('npmRunScriptStreaming', JSON.stringify([script, args, pkg.name]));

  const argv = ['run', script, ...args];
  const opts = makeOpts(pkg, reject);

  return spawnStreaming(npmClient, argv, opts, prefix && pkg.name, cmdDryRun);
}

function makeOpts(pkg, reject) {
  return Object.assign(getNpmExecOpts(pkg), {
    windowsHide: false,
    reject,
  });
}
