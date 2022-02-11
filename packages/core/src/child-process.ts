import chalk from 'chalk';
import execa from 'execa';
import log from 'npmlog';
import os from 'os';
import logTransformer from 'strong-log-transformer';
import { Package } from '.';

// bookkeeping for spawned processes
const children = new Set();

// when streaming processes are spawned, use this color for prefix
const colorWheel = ['cyan', 'magenta', 'blue', 'yellow', 'green', 'red'];
const NUM_COLORS = colorWheel.length;

// ever-increasing index ensures colors are always sequential
let currentColor = 0;

export function exec(command: string, args: string[], opts: any, cmdDryRun = false) {
  const options = Object.assign({ stdio: 'pipe' }, opts);
  const spawned = spawnProcess(command, args, options, cmdDryRun);

  return cmdDryRun ? Promise.resolve() : wrapError(spawned);
}

// resultCallback?: (processResult: ChildProcessResult) => void
export function execSync(command: string, args?: string[], opts?: any, cmdDryRun = false) {
  return cmdDryRun
    ? logExecCommand(command, args)
    : execa.sync(command, args, opts).stdout;
}

export function spawn(command: string, args: string[], opts: any, cmdDryRun = false) {
  const options = Object.assign({}, opts, { stdio: 'inherit' });
  const spawned = spawnProcess(command, args, options, cmdDryRun);

  return wrapError(spawned);
}

// istanbul ignore next
export function spawnStreaming(command: string, args: string[], opts: any, prefix?: string | boolean, cmdDryRun = false) {
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

export function getChildProcessCount() {
  return children.size;
}

export function getExitCode(result: any) {
  // https://nodejs.org/docs/latest-v6.x/api/child_process.html#child_process_event_close
  if (typeof result.code === 'number') {
    return result.code;
  }

  // https://nodejs.org/docs/latest-v6.x/api/errors.html#errors_error_code
  // istanbul ignore else
  if (typeof result.code === 'string') {
    return os.constants.errno[result.code];
  }

  // istanbul ignore next: extremely weird
  throw new TypeError(`Received unexpected exit code value ${JSON.stringify(result.code)}`);
}

export function spawnProcess(command: string, args: string[], opts: execa.SyncOptions<string> & { pkg: Package }, cmdDryRun = false) {
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

export function wrapError(spawned) {
  if (spawned.pkg) {
    return spawned.catch(err => {
      // istanbul ignore else
      if (err.code) {
        // ensure code is always a number
        err.code = getExitCode(err);

        // log non-lerna error cleanly
        err.pkg = spawned.pkg;
      }

      throw err;
    });
  }

  return spawned;
}

export function logExecCommand(command, args?: string[]) {
  const argStr = (Array.isArray(args) ? args.join(' ') : args) ?? '';

  const cmdList = [];
  for (const c of [command, argStr]) {
    // @ts-ignore
    cmdList.push((Array.isArray(c) ? c.join(' ') : c));
  }

  log.info('dry-run>', cmdList.join(' '));
  return '';
}
