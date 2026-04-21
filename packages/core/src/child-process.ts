import { constants } from 'node:os';

import { log } from '@lerna-lite/npmlog';
import { x, xSync, type Options } from 'tinyexec';

import type { Package } from './package.js';
import { colorize } from './utils/colorize.js';
import { addPrefixTransformer } from './utils/log-prefix-transformer.js';

export type TinyExecOptions = Omit<Partial<Options>, 'stdin' | 'nodeOptions'> & {
  pkg?: Package;
  cwd?: string | URL;
  env?: NodeJS.ProcessEnv;
  stdin?: any;
  nodeOptions?: any;
  [key: string]: any;
};

type TinyExecResult = ReturnType<typeof x> & { pkg?: Package; stdio?: any[]; commandName?: string; args?: string[] };

const children = new Set<any>();

// when streaming processes are spawned, use this color for prefix
const colorWheel = ['cyan', 'magenta', 'blue', 'yellow', 'green', 'red'] as const;
const NUM_COLORS = colorWheel.length;

// ever-increasing index ensures colors are always sequential
let currentColor = 0;

const stripFinalNewline = (str: any) => (typeof str === 'string' ? str.replace(/\r?\n$/, '').trim() : str);

/**
 * Execute a command asynchronously, piping stdio by default.
 * @param {string} command
 * @param {string[]} args
 * @param {TinyExecOptions} [opts]
 * @param {boolean} [dryRun]
 */
export function exec(command: string, args: string[], opts?: TinyExecOptions, dryRun = false): Promise<any> {
  const spawned = spawnProcess(command, args, opts, dryRun) as TinyExecResult;
  if (spawned && typeof spawned === 'object') {
    spawned.commandName = command;
    spawned.args = args;
  }
  return dryRun ? Promise.resolve() : wrapError(spawned);
}

/**
 * Execute a command synchronously.
 * @param {string} command
 * @param {string[]} args
 * @param {TinyExecOptions} [opts]
 * @param {boolean} [dryRun]
 */
export function execSync(command: string, args: string[] = [], opts?: TinyExecOptions, dryRun = false) {
  if (dryRun) {
    return logExecCommand(command, args);
  }

  const result = xSync(command, args, _mapOptions(command, opts));

  if (result.exitCode !== 0) {
    throw _createEnhancedError(result, command, args);
  }

  return typeof result.stdout === 'string' ? stripFinalNewline(result.stdout) : result.stdout;
}

/**
 * Spawn a command asynchronously, _always_ inheriting stdio.
 * @param {string} command
 * @param {string[]} args
 * @param {TinyExecOptions} [opts]
 * @param {boolean} [dryRun]
 */
export function spawn(command: string, args: string[], opts?: TinyExecOptions, dryRun = false): Promise<any> {
  const options = { ...opts, nodeOptions: { ...opts?.nodeOptions, stdio: 'inherit' } };
  const child = spawnProcess(command, args, options, dryRun) as TinyExecResult;

  if (child && typeof child === 'object' && !dryRun) {
    child.commandName = command;
    child.args = args;
    child.stdio = [null, null, null];
  }
  return wrapError(child);
}

/**
 * Spawn a command asynchronously, streaming stdio with optional prefix.
 * @param {string} command
 * @param {string[]} args
 * @param {TinyExecOptions} [opts]
 * @param {string} [prefix]
 * @param {boolean} [dryRun]
 */
export function spawnStreaming(
  command: string,
  args: string[],
  opts?: TinyExecOptions,
  prefix?: string | boolean,
  dryRun = false
): Promise<any> {
  const options = { ...opts, nodeOptions: { ...opts?.nodeOptions, stdio: ['ignore', 'pipe', 'pipe'] } };
  const spawned = spawnProcess(command, args, options, dryRun) as TinyExecResult;

  if (dryRun) {
    return Promise.resolve();
  }

  if (spawned && typeof spawned === 'object') {
    spawned.commandName = command;
    spawned.args = args;
    spawned.stdio = [null, spawned.process?.stdout, spawned.process?.stderr];
  }

  const stdoutOpts: any = {};
  const stderrOpts: any = {}; // mergeMultiline causes escaped newlines :P

  if (prefix) {
    const colorName = colorWheel[currentColor % NUM_COLORS];
    currentColor += 1;
    stdoutOpts.tag = `${colorize(['bold', colorName], String(prefix))}:`;
    stderrOpts.tag = `${colorize([colorName], String(prefix))}:`;
  }

  // Avoid 'Possible EventEmitter memory leak detected' warning due to piped stdio
  if (children.size > process.stdout.listenerCount('close')) {
    process.stdout.setMaxListeners(children.size);
    process.stderr.setMaxListeners(children.size);
  }

  spawned.process?.stdout?.pipe(addPrefixTransformer(stdoutOpts)).pipe(process.stdout);
  spawned.process?.stderr?.pipe(addPrefixTransformer(stderrOpts)).pipe(process.stderr);

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
  if (typeof result.code === 'string' || typeof result.exitCode === 'string') {
    return constants.errno[result.code ?? result.exitCode];
  }

  /* v8 ignore next : extremely weird */
  throw new TypeError(`Received unexpected exit code value ${JSON.stringify(result.code ?? result.exitCode)}`);
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {TinyExecOptions} opts
 * @param {boolean} [dryRun]
 */
export function spawnProcess(command: string, args: string[], opts: TinyExecOptions = {}, dryRun = false) {
  if (dryRun) {
    return logExecCommand(command, args);
  }
  const child = x(command, args, _mapOptions(command, opts)) as TinyExecResult;
  const nodeProcess = child.process;

  // Cleans up the child from the children set when the process exits or errors
  const drain = (_code?: number, signal?: string) => {
    children.delete(child);
    // don't run repeatedly if this is the error event
    if (signal === undefined) {
      nodeProcess?.removeListener('exit', drain);
    }
  };

  nodeProcess?.once('exit', drain);
  nodeProcess?.once('error', drain);

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
 * @param {TinyExecOptions} [opts]
 */
export function wrapError(spawned: any) {
  const promise = Promise.resolve(spawned)
    .then((result: any) => {
      if (result && result.exitCode !== 0 && result.exitCode !== undefined) {
        throw _createEnhancedError(result, spawned.commandName || '', spawned.args || []);
      }
      if (result && typeof result.stdout === 'string') {
        result.stdout = stripFinalNewline(result.stdout);
      }
      return result;
    })
    .catch((err: any) => {
      // Re-wrap if it's already an error from tinyexec's own rejection (though throwOnError is false)
      if (err.exitCode !== undefined || err.code !== undefined) {
        const enhanced = _createEnhancedError(err, spawned.commandName || '', spawned.args || []);
        if (spawned.pkg) (enhanced as any).pkg = spawned.pkg;
        throw enhanced;
      }
      throw err;
    });

  if (spawned.stdio) {
    (promise as any).stdio = spawned.stdio;
  }
  return promise;
}

/**
 * Log the child-process command and its arguments as dry-run (without executing the process)
 * @param {string} command
 * @param {string[]} args
 */
export function logExecCommand(command: string, args?: string[]): string {
  const argStr = (Array.isArray(args) ? args.join(' ') : args) ?? '';
  const cmdList: string[] = [];

  // Restored your original loop to handle nested array/string mixing
  for (const c of [command, argStr]) {
    cmdList.push(Array.isArray(c) ? (c as string[]).join(' ') : (c as string));
  }

  log.info(colorize(['bold', 'magenta'], '[dry-run] >'), cmdList.join(' '));
  return '';
}

// --
// private helpers

/** Creates an enhanced error object with extra process details */
function _createEnhancedError(result: any, command: string, args: string[] = []) {
  const exitCode = getExitCode(result);
  const fullCommand = `${command} ${args.join(' ')}`.trim();
  const stdout = stripFinalNewline(result.stdout || '');
  const stderr = stripFinalNewline(result.stderr || '');

  const message = `Command failed: ${fullCommand}\n${stderr || `Process exited with status ${exitCode}`}`;

  const newErr: any = new Error(message);

  // Direct assignment to ensure maximum visibility to Lerna's catch blocks
  newErr.message = message;
  newErr.exitCode = exitCode;
  newErr.stdout = stdout;
  newErr.stderr = stderr;
  newErr.all = stderr || stdout;
  newErr.shortMessage = `Command failed: ${fullCommand}`;
  newErr.command = fullCommand;
  newErr.failed = true;
  newErr.timedOut = false;
  newErr.isCanceled = false;
  newErr.killed = false;

  return newErr;
}

/** Maps Lerna/TinyExec options to tinyexec Options format */
function _mapOptions(command: string, opts?: TinyExecOptions): Options {
  const { cwd, env, nodeOptions, ...rest } = opts || {};

  // Only use shell for the 'exit' command (used in status tests)
  // Using shell: true for 'git commit' causes arguments with spaces to break.
  const useShell = command === 'exit' || rest.shell === true;

  // 'collect: true' tells tinyexec to collect stdout/stderr as strings (like execa),
  // so we can access them on the result object. The 'as any' cast is used because
  // our merged options may not exactly match the Options type, but tinyexec accepts it.
  return {
    ...rest,
    throwOnError: false,
    collect: true, // collect output as string (like execa)
    nodeOptions: {
      cwd,
      env,
      shell: useShell,
      ...nodeOptions,
    },
  } as any;
}
