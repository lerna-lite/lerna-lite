import chalk from 'chalk';
import execa from 'execa';
import log from 'npmlog';
import os from 'os';
import logTransformer from 'strong-log-transformer';

import { Package } from './package';

// bookkeeping for spawned processes
const children = new Set();

// when streaming processes are spawned, use this color for prefix
const colorWheel = ['cyan', 'magenta', 'blue', 'yellow', 'green', 'red'];
const NUM_COLORS = colorWheel.length;

// ever-increasing index ensures colors are always sequential
let currentColor = 0;

/**
 * Execute a command asynchronously, piping stdio by default.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 */
export function exec(command: string, args: string[], opts?: execa.Options & { pkg?: Package }, cmdDryRun = false): Promise<any> {
  const options = Object.assign({ stdio: 'pipe' }, opts);
  const spawned = spawnProcess(command, args, options, cmdDryRun);

  return cmdDryRun ? Promise.resolve() : wrapError(spawned);
}

/**
 * Execute a command synchronously.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").SyncOptions} [opts]
 */
export function execSync(command: string, args?: string[], opts?: execa.SyncOptions<string>, cmdDryRun = false) {
  return cmdDryRun
    ? logExecCommand(command, args)
    : execa.sync(command, args, opts).stdout;
}

/**
 * Spawn a command asynchronously, _always_ inheriting stdio.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 */
export function spawn(command: string, args: string[], opts?: execa.Options & { pkg?: Package }, cmdDryRun = false): Promise<any> {
  const options = Object.assign({}, opts, { stdio: 'inherit' });
  const spawned = spawnProcess(command, args, options, cmdDryRun);

  return wrapError(spawned);
}

/**
 * Spawn a command asynchronously, streaming stdio with optional prefix.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 * @param {string} [prefix]
 */
// istanbul ignore next
export function spawnStreaming(command: string, args: string[], opts?: execa.Options & { pkg?: Package }, prefix?: string | boolean, cmdDryRun = false): Promise<any> {
  const options: any = Object.assign({}, opts);
  options.stdio = ['ignore', 'pipe', 'pipe'];

  const spawned = spawnProcess(command, args, options, cmdDryRun) as execa.ExecaChildProcess<string>;

  const stdoutOpts: any = {};
  const stderrOpts: any = {}; // mergeMultiline causes escaped newlines :P

  if (prefix) {
    const colorName = colorWheel[currentColor % NUM_COLORS];
    const color = chalk[colorName];

    currentColor += 1;

    stdoutOpts.tag = `${color.bold(prefix)}:`;
    stderrOpts.tag = `${color(prefix)}:`;
  }

  // Avoid 'Possible EventEmitter memory leak detected' warning due to piped stdio
  if (children.size > process.stdout.listenerCount('close')) {
    process.stdout.setMaxListeners(children.size);
    process.stderr.setMaxListeners(children.size);
  }

  spawned.stdout!.pipe(logTransformer(stdoutOpts)).pipe(process.stdout);
  spawned.stderr!.pipe(logTransformer(stderrOpts)).pipe(process.stderr);

  return wrapError(spawned);
}

export function getChildProcessCount(): number {
  return children.size;
}

export function getExitCode(result: any) {
  // https://nodejs.org/docs/latest-v6.x/api/child_process.html#child_process_event_close
  if (typeof result.code === 'number' || typeof result.exitCode === 'number') {
    return result.code ?? result.exitCode;
  }

  // https://nodejs.org/docs/latest-v6.x/api/errors.html#errors_error_code
  // istanbul ignore else
  if (typeof result.code === 'string' || typeof result.exitCode === 'string') {
    return os.constants.errno[result.code ?? result.exitCode];
  }

  // istanbul ignore next: extremely weird
  throw new TypeError(`Received unexpected exit code value ${JSON.stringify(result.code ?? result.exitCode)}`);
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} opts
 */
export function spawnProcess(command: string, args: string[], opts: execa.Options & { pkg?: Package }, cmdDryRun = false) {
  if (cmdDryRun) {
    return logExecCommand(command, args);
  }
  const child: any = execa(command, args, opts);
  const drain = (_code, signal) => {
    children.delete(child);

    // don't run repeatedly if this is the error event
    if (signal === undefined) {
      child.removeListener('exit', drain);
    }
  };

  child.once('exit', drain);
  child.once('error', drain);

  if (opts.pkg) {
    child.pkg = opts.pkg;
  }

  children.add(child);

  return child;
}

/**
 * Spawn a command asynchronously, _always_ inheriting stdio.
 * @param {string} command
 * @param {string[]} args
 * @param {import("execa").Options} [opts]
 */
export function wrapError(spawned: execa.ExecaChildProcess & { pkg?: Package }) {
  if (spawned.pkg) {
    return spawned.catch((err: any) => {
      // ensure exit code is always a number
      err.exitCode = getExitCode(err);

      // log non-lerna error cleanly
      err.pkg = spawned.pkg;

      throw err;
    });
  }

  return spawned;
}

/**
 * Log the child-process command and its arguments as dry-run (without executing the process)
 * @param {string} command
 * @param {string[]} args
 */
export function logExecCommand(command: string, args?: string[]) {
  const argStr = (Array.isArray(args) ? args.join(' ') : args) ?? '';

  const cmdList: string[] = [];
  for (const c of [command, argStr]) {
    cmdList.push((Array.isArray(c) ? c.join(' ') : c));
  }

  log.info('dry-run>', cmdList.join(' '));
  return '';
}
