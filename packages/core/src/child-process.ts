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

type TinyExecResult = ReturnType<typeof x> & {
  pkg?: Package;
  stdio?: any[];
  commandName?: string;
  args?: string[];
  reject?: boolean;
};

// bookkeeping for spawned processes
const children = new Set<any>();

// when streaming processes are spawned, use this color for prefix
const colorWheel = ['cyan', 'magenta', 'blue', 'yellow', 'green', 'red'] as const;
const NUM_COLORS = colorWheel.length;

// ever-increasing index ensures colors are always sequential
let currentColor = 0;

/** Replicates Execa's stripFinalNewline: true behavior. */
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

  const { command: shellCommand, args: shellArgs } = _prepareShellCommand(command, args, _isShellEnabled(command, opts));
  const result = xSync(shellCommand, shellArgs, _mapOptions(command, opts));

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

export function getExitCode(result: any): number | TypeError {
  // https://nodejs.org/docs/latest-v6.x/api/child_process.html#child_process_event_close
  if (typeof result.code === 'number' || typeof result.exitCode === 'number') {
    return (result.code ?? result.exitCode) as number;
  }

  // https://nodejs.org/docs/latest-v6.x/api/errors.html#errors_error_code
  if (typeof result.code === 'string' || typeof result.exitCode === 'string') {
    /* v8 ignore next */
    return constants.errno[(result.code ?? result.exitCode) as number] as number;
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
  const { command: shellCommand, args: shellArgs } = _prepareShellCommand(command, args, _isShellEnabled(command, opts));
  const child = x(shellCommand, shellArgs, _mapOptions(command, opts)) as TinyExecResult;
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
  // Preserve the reject option for wrapError to use
  if (opts.reject !== undefined) {
    child.reject = opts.reject;
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
      // Handle non-zero exit codes based on reject option
      if (result && result.exitCode !== 0 && result.exitCode !== undefined) {
        if (spawned.reject !== false) {
          // Default behavior: throw the error
          throw _createEnhancedError(result, spawned.commandName || '', spawned.args || []);
        }
        // When reject is false (--no-bail), mark result as failed and return it
        // This allows commands like exec/run to detect the failure and set process.exitCode
        result.failed = true;
      }
      if (result && typeof result.stdout === 'string') {
        result.stdout = stripFinalNewline(result.stdout);
      }
      return result;
    })
    .catch((err: any) => {
      // Re-wrap if it's already an error from tinyexec's own rejection (though throwOnError is false)
      // These are spawn-level errors like ENOENT and should always be converted to controlled errors
      if (err.exitCode !== undefined || err.code !== undefined) {
        const enhanced = _createEnhancedError(err, spawned.commandName || '', spawned.args || []);
        if (spawned.pkg) {
          (enhanced as any).pkg = spawned.pkg;
        }
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

/** Determines whether the command should run through a shell */
function _isShellEnabled(command: string, opts?: TinyExecOptions): boolean {
  // Only use shell for the 'exit' command (used in status tests)
  // Using shell: true for 'git commit' causes arguments with spaces to break.
  return command === 'exit' || opts?.shell === true;
}

/**
 * When running with `shell: true`, Node's `child_process.spawn()` refuses to safely combine a
 * separate `command` and `args` array (see DEP0190) and instead just concatenates them, unescaped.
 * To avoid that deprecation warning and match the pre-tinyexec (execa) behavior, pre-join the
 * command and its args into a single string and hand the shell an empty args array.
 */
function _prepareShellCommand(command: string, args: string[], useShell: boolean): { command: string; args: string[] } {
  if (!useShell || args.length === 0) {
    return { command, args };
  }
  return { command: [command, ...args].join(' '), args: [] };
}

/** Maps Lerna/TinyExec options to tinyexec Options format */
function _mapOptions(command: string, opts?: TinyExecOptions): Options {
  const { cwd, env, nodeOptions, maxBuffer, ...rest } = opts || {};
  const useShell = _isShellEnabled(command, opts);

  // 'collect: true' tells tinyexec to collect stdout/stderr as strings (like execa),
  // so we can access them on the result object. The 'as any' cast is used because
  // our merged options may not exactly match the Options type, but tinyexec accepts it.
  return {
    ...rest,
    throwOnError: false,
    collect: true, // collect output as string (like execa)
    // tinyexec defaults to prepending node_modules/.bin *and* the running Node executable's
    // own directory to PATH for every spawn. Unlike execa's opt-in `preferLocal`, this is
    // silently on by default and can shadow the user's real PATH resolution (e.g. a stale
    // pnpm/node shim living next to the Node binary winning over the correct one on PATH).
    // Preserve the pre-tinyexec (execa) behavior of leaving PATH untouched unless requested.
    nodePath: rest.nodePath ?? false,
    nodeOptions: {
      cwd,
      env,
      shell: useShell,
      // tinyexec only forwards maxBuffer to Node's spawn/spawnSync through nodeOptions,
      // so it must live here rather than at the top level (where the `--max-buffer`
      // option currently lands, silently ignored). Without a large default, sync git
      // calls that emit big output overflow Node's 1MB default and throw ENOBUFS —
      // e.g. `git tag --list '*@*'` in independent mode on repos with tens of thousands
      // of tags, which hasTags swallows as ENOTAGS -> "Assuming all packages changed".
      // Default to 100MB to match the pre-tinyexec (execa) behavior.
      maxBuffer: maxBuffer ?? 100 * 1024 * 1024,
      ...nodeOptions,
    },
  } as any;
}
