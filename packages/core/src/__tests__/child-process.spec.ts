import { EventEmitter } from 'node:events';
import { constants, tmpdir } from 'node:os';
import { join } from 'node:path';

import { log } from '@lerna-lite/npmlog';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { exec, execSync, getChildProcessCount, getExitCode, spawn, spawnStreaming, logExecCommand, wrapError } from '../child-process.js';
import { colorize } from '../index.js';
import type { Package } from '../package.js';

describe('childProcess', () => {
  it('should throw type error on weird but rare error structure', () => {
    try {
      getExitCode({ exitCode: { message: 'some error' } });
    } catch (e: any) {
      expect(e.message).toBe('Received unexpected exit code value {"message":"some error"}');
    }
  });

  describe('.execSync()', () => {
    it('should execute a command in a child process and return the result', () => {
      expect(execSync('echo', ['execSync'], { shell: true })).toContain(`execSync`);
    });

    it('should execute a command in dry-run and log the command', () => {
      const logSpy = vi.spyOn(log, 'info');
      execSync('echo', ['execSync'], undefined, true);
      expect(logSpy).toHaveBeenCalledWith(colorize(['bold', 'magenta'], '[dry-run] >'), 'echo execSync');
    });

    it('does not error when stdout is ignored', () => {
      expect(() => execSync('echo', ['ignored'], { stdio: 'ignore' })).not.toThrow();
    });
  });

  describe('.exec()', () => {
    it('returns a tinyexec Promise', async () => {
      const { stderr, stdout } = (await exec('echo', ['foo'], { shell: true })) as any;

      expect(stderr).toBe('');
      expect(stdout).toContain('foo');
    });

    it('should execute a command in dry-run and log the command', async () => {
      const logSpy = vi.spyOn(log, 'info');
      await exec('echo', ['exec'], undefined, true);
      expect(logSpy).toHaveBeenCalledWith(colorize(['bold', 'magenta'], '[dry-run] >'), 'echo exec');
    });

    it('rejects on undefined command', async () => {
      const result = exec('nowImTheModelOfAModernMajorGeneral', undefined as any);

      await expect(result).rejects.toThrow(/\bnowImTheModelOfAModernMajorGeneral\b/);
      expect(getChildProcessCount()).toBe(0);
    });

    it('cleans up after a child spawn error', async () => {
      const result = exec(process.execPath, ['-e', ''], { cwd: join(tmpdir(), 'missing-lerna-lite-child-cwd') });

      await expect(result).rejects.toThrow(/Process exited with status 2/);
      expect(getChildProcessCount()).toBe(0);
    });

    it('registers child processes that are created', async () => {
      const echoOne = exec('echo', ['one'], { shell: true });
      expect(getChildProcessCount()).toBe(1);

      const echoTwo = exec('echo', ['two'], { shell: true });
      expect(getChildProcessCount()).toBe(2);

      const [one, two] = (await Promise.all([echoOne, echoTwo])) as any;
      expect(one.stdout).toContain(`one`);
      expect(two.stdout).toContain(`two`);
    });

    it('decorates opts.pkg on error if caught', async () => {
      const result = exec('theVeneratedVirginianVeteranWhoseMenAreAll', ['liningUpToPutMeUpOnAPedestal'], {
        pkg: { name: 'hamilton' } as Package,
      });

      await expect(result).rejects.toThrow(
        expect.objectContaining({
          pkg: { name: 'hamilton' },
        })
      );
    });

    it('supports large stdout without explicit maxBuffer override (async regression for #1373)', async () => {
      const size = 2 * 1024 * 1024; // 2MB, larger than Node's default 1MB spawnSync buffer
      const { stdout } = (await exec('node', ['-e', `process.stdout.write('x'.repeat(${size}))`])) as any;

      expect(typeof stdout).toBe('string');
      expect(stdout.length).toBe(size);
    });

    it('supports explicit maxBuffer option for large async stdout', async () => {
      const size = 2 * 1024 * 1024;

      const { stdout } = (await exec('node', ['-e', `process.stdout.write('x'.repeat(${size}))`], {
        maxBuffer: 128 * 1024,
      })) as any;

      expect(typeof stdout).toBe('string');
      expect(stdout.length).toBe(size);
    });

    it('preserves leading spaces and extra newlines in captured stdout', async () => {
      const code = `process.stdout.write(${JSON.stringify('  keep  \n\n')})`;
      expect((await exec(process.execPath, ['-e', code])).stdout).toBe('  keep  \n');
      expect(execSync(process.execPath, ['-e', code])).toBe('  keep  \n');
    });

    it('decodes UTF-8 characters split across output chunks', async () => {
      const code = 'process.stdout.write(Buffer.from([0xe2])); setTimeout(() => process.stdout.write(Buffer.from([0x82, 0xac])), 25);';
      const result = await exec(process.execPath, ['-e', code]);

      expect(result.stdout).toBe(String.fromCodePoint(0x20ac));
    });

    it('respects reject: false option to avoid throwing on non-zero exit code', async () => {
      const result = await exec('exit', ['99'], {
        reject: false,
        shell: true,
      });

      // Should not throw and should mark result as failed
      expect(result).toBeDefined();
      expect((result as any).exitCode).toBe(99);
      expect((result as any).failed).toBe(true);
    });
  });

  describe('.spawn()', () => {
    it('treats signal termination as a failure with a numeric exit status', async () => {
      const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { reject: false });
      child.process!.kill('SIGTERM');
      const result = await child;
      expect(result.failed).toBe(true);
      expect(result.exitCode).toBe(143);
    });
    it('exposes the native child process for lifecycle management', async () => {
      const child = spawn(process.execPath, ['-e', 'process.exit(0)']);
      expect(child.process?.pid).toEqual(expect.any(Number));
      await child;
    });
    it('should spawn a command in a child process that always inherits stdio', async () => {
      const child = spawn('echo', ['-n'], { shell: true }) as any;
      expect(child.stdio).toEqual([null, null, null]);

      const { exitCode, signal } = await child;
      expect(exitCode).toBe(0);
      expect(signal).toBe(undefined);
    });

    it('should execute a command in dry-run and log the command', async () => {
      const logSpy = vi.spyOn(log, 'info');
      await spawn('echo', ['-n'], undefined, true);
      expect(logSpy).toHaveBeenCalledWith(colorize(['bold', 'magenta'], '[dry-run] >'), 'echo -n');
    });

    it('decorates opts.pkg on error if caught', async () => {
      const result = spawn('exit', ['123'], {
        pkg: { name: 'shelled' } as Package,
        shell: true,
      });

      await expect(result).rejects.toThrow(
        expect.objectContaining({
          exitCode: 123,
          pkg: { name: 'shelled' },
        })
      );
    });

    it('respects reject: false option to avoid throwing on non-zero exit code', async () => {
      const result = await spawn('exit', ['42'], {
        reject: false,
        shell: true,
      });

      // Should not throw and should mark result as failed
      expect(result).toBeDefined();
      expect(result.exitCode).toBe(42);
      expect(result.failed).toBe(true);
    });

    it('preserves reject option on spawned object for wrapError to use', async () => {
      const result = await spawn('node', ['-e', 'process.exit(5)'], {
        reject: false,
      });

      expect(result.exitCode).toBe(5);
      expect(result.failed).toBe(true);
    });
  });

  describe('.spawnStreaming()', () => {
    it('streams repeated commands without retaining their output or ending the parent streams', async () => {
      for (let i = 0; i < 2; i++) {
        const child = spawnStreaming(process.execPath, ['-e', 'console.log("streamed"); console.error("error output")'], { buffer: false });
        expect(child.process?.pid).toEqual(expect.any(Number));
        const result = await child;
        expect(result).toEqual({ exitCode: 0, stdout: '', stderr: '' });
        expect(process.stdout.writableEnded).toBe(false);
        expect(process.stderr.writableEnded).toBe(false);
      }
      expect(getChildProcessCount()).toBe(0);
    });

    it('preserves failures when streaming without buffering', async () => {
      await expect(spawnStreaming(process.execPath, ['-e', 'process.exit(7)'], { buffer: false })).rejects.toMatchObject({ exitCode: 7 });
      const result = await spawnStreaming(process.execPath, ['-e', 'process.exit(7)'], { buffer: false, reject: false });
      expect(result.failed).toBe(true);
      expect(result.exitCode).toBe(7);
    });

    it('reports spawn errors when streaming without buffering', async () => {
      await expect(spawnStreaming('nonexistent-lerna-watch-command', [], { buffer: false })).rejects.toThrow(/nonexistent-lerna-watch-command/);
      expect(getChildProcessCount()).toBe(0);
    });
    it('should spawn a command in a child process that always inherits stdio', async () => {
      const child = spawnStreaming('echo', ['-n'], { shell: true }) as any;
      expect(child.stdio).toEqual([null, expect.anything(), expect.anything()]);

      const { exitCode, signal } = await child;
      expect(exitCode).toBe(0);
      expect(signal).toBe(undefined);
    });

    it('should cover the prefix block when prefix is provided', async () => {
      const child = spawnStreaming('node', ['-e', 'console.log("prefix test")'], undefined, 'my-prefix');
      const { exitCode } = await child;
      expect(exitCode).toBe(0);
    });

    it('should execute a command in dry-run and log the command', async () => {
      const logSpy = vi.spyOn(log, 'info');

      await spawnStreaming('echo', ['-n'], { stdio: 'inherit' }, 'my-prefix', true);

      expect(logSpy).toHaveBeenCalledWith(colorize(['bold', 'magenta'], '[dry-run] >'), 'echo -n');
    });

    it('decorates opts.pkg on error if caught', async () => {
      const result = spawnStreaming('exit', ['123'], {
        pkg: { name: 'shelled' } as Package,
        shell: true,
      });

      await expect(result).rejects.toThrow(
        expect.objectContaining({
          exitCode: 123,
          pkg: { name: 'shelled' },
        })
      );
    });
  });

  describe('maxListeners logic', () => {
    it('raises listener limits for concurrent streams without lowering existing limits', async () => {
      const stdoutLimit = process.stdout.getMaxListeners();
      const stderrLimit = process.stderr.getMaxListeners();
      const stdoutSet = vi.spyOn(process.stdout, 'setMaxListeners');
      const stderrSet = vi.spyOn(process.stderr, 'setMaxListeners');
      const stdoutGet = vi.spyOn(process.stdout, 'getMaxListeners').mockReturnValue(1);
      const stderrGet = vi.spyOn(process.stderr, 'getMaxListeners').mockReturnValue(1);
      try {
        await Promise.all([
          spawnStreaming(process.execPath, ['-e', 'setTimeout(() => {}, 50)']),
          spawnStreaming(process.execPath, ['-e', 'setTimeout(() => {}, 50)']),
        ]);
        expect(stdoutSet).toHaveBeenCalled();
        expect(stderrSet).toHaveBeenCalled();
        stdoutGet.mockReturnValue(100);
        stderrGet.mockReturnValue(100);
        stdoutSet.mockClear();
        stderrSet.mockClear();
        await spawnStreaming(process.execPath, ['-e', 'process.exit(0)']);
        expect(stdoutSet).not.toHaveBeenCalled();
        expect(stderrSet).not.toHaveBeenCalled();
      } finally {
        stdoutGet.mockRestore();
        stderrGet.mockRestore();
        stdoutSet.mockRestore();
        stderrSet.mockRestore();
        process.stdout.setMaxListeners(stdoutLimit);
        process.stderr.setMaxListeners(stderrLimit);
      }
    });
  });

  describe('wrapError error propagation', () => {
    it('settles the unbuffered wrapper when the child closes', async () => {
      const child = new EventEmitter();
      const promise = wrapError({ process: child }, false);
      child.emit('close', 0, null);

      await expect(promise).resolves.toMatchObject({ exitCode: 0, stdout: '', stderr: '' });
    });

    it('rejects the unbuffered wrapper when the child emits an error', async () => {
      const child = new EventEmitter();
      const error = new Error('spawn failed');
      const promise = wrapError({ process: child }, false);
      child.emit('error', error);

      await expect(promise).rejects.toBe(error);
    });

    it('should throw original error if no exitCode or code', async () => {
      // Simulate a spawned object that rejects with a plain error, using a custom thenable
      const { wrapError } = await import('../child-process.js');
      const error = new Error('plain error');
      // eslint-disable-next-line unicorn/no-thenable -- intentionally creating a thenable to simulate rejected spawn
      const dummy = { then: (_res: any, rej: any) => rej(error) } as any;
      await expect(wrapError(dummy)).rejects.toThrow('plain error');
    });

    it('should propagate enhanced error with pkg property', async () => {
      const result = exec('exit', ['123'], { pkg: { name: 'errpkg' } as Package, shell: true });
      await expect(result).rejects.toThrow(
        expect.objectContaining({
          exitCode: 123,
          pkg: { name: 'errpkg' },
          failed: true,
        })
      );
    });
  });

  describe('children set cleanup', () => {
    it('should clean up children set after process exit', async () => {
      const before = getChildProcessCount();
      await exec('echo', ['cleanup'], { shell: true });
      expect(getChildProcessCount()).toBe(before);
    });
  });

  describe('sync API edge cases', () => {
    it('should throw enhanced error on non-zero exit code (sync)', () => {
      expect(() => execSync('exit', ['5'], { shell: true })).toThrow(
        expect.objectContaining({
          exitCode: 5,
          failed: true,
        })
      );
    });

    it('should trim trailing newline from stdout (sync)', () => {
      // Use node for cross-platform output
      const out = execSync('node', ['-e', "process.stdout.write('trimmed\\n')"]);
      expect(out).toBe('trimmed');
    });

    it('supports large stdout without explicit maxBuffer override (regression for #1373)', () => {
      const size = 2 * 1024 * 1024; // 2MB, larger than Node's default 1MB spawnSync buffer
      const out = execSync('node', ['-e', `process.stdout.write('x'.repeat(${size}))`]);

      expect(typeof out).toBe('string');
      expect((out as string).length).toBe(size);
    });

    it('honors maxBuffer override by forwarding it to nodeOptions', () => {
      const size = 2 * 1024 * 1024;

      expect(() =>
        execSync('node', ['-e', `process.stdout.write('x'.repeat(${size}))`], {
          maxBuffer: 128 * 1024,
        })
      ).toThrow(/ENOBUFS|maxBuffer|stdout maxBuffer/i);
    });
  });

  describe('advanced options', () => {
    it('should respect cwd and env options', async () => {
      const cwd = process.cwd();
      const { stdout } = await exec('node', ['-e', 'console.log(process.cwd())'], { cwd });
      expect(stdout).toContain(cwd);
      const { stdout: envOut } = await exec('node', ['-e', 'console.log(process.env.TEST_ENV_VAR)'], {
        env: { ...process.env, TEST_ENV_VAR: 'hello' },
      });
      expect(envOut).toContain('hello');
    });

    it('should use shell option when specified', async () => {
      const { stdout } = await exec('echo $SHELL_TEST', [], { shell: true, env: { ...process.env, SHELL_TEST: 'ok' } });
      // On Windows, shell variable expansion may not work, so just check for no error
      expect(typeof stdout).toBe('string');
    });
  });

  describe('getExitCode()', () => {
    it('returns numeric `code` when present', () => {
      expect(getExitCode({ code: 0 })).toBe(0);
      expect(getExitCode({ exitCode: 2 })).toBe(2);
    });

    it('resolves string error codes to errno numeric values', () => {
      // Use a common errno name that exists on Node's constants.errno map
      const name = 'EACCES';
      const expected = constants.errno[name];
      expect(getExitCode({ code: name })).toBe(expected);
    });

    it('throws TypeError for unexpected exit code values', () => {
      expect(() => getExitCode({} as any)).toThrow(TypeError);
    });
  });

  describe('logExecCommand()', () => {
    it('handles array command/args gracefully', () => {
      const logSpy = vi.spyOn(log, 'info');
      // call with array command to hit Array.isArray branch
      (logExecCommand as any)(['echo', '-n'], ['one', 'two']);
      expect(logSpy).toHaveBeenCalled();
    });
  });
});

describe('shell command joining (DEP0190 avoidance)', () => {
  afterEach(() => {
    vi.doUnmock('tinyexec');
    vi.resetModules();
  });

  it('joins command and args into a single string with empty args when shell is true', async () => {
    const xMock = vi.fn(() => Promise.resolve({ exitCode: 0, stdout: '', stderr: '' }));
    vi.doMock('tinyexec', () => ({ x: xMock, xSync: vi.fn() }));
    vi.resetModules();

    const { spawnProcess } = await import('../child-process.js');
    spawnProcess('pnpm', ['run', '-r', '--filter', '$LERNA_PACKAGE_NAME', 'dev'], { shell: true });

    expect(xMock).toHaveBeenCalledWith(
      'pnpm run -r --filter $LERNA_PACKAGE_NAME dev',
      [],
      expect.objectContaining({ nodeOptions: expect.objectContaining({ shell: true }) })
    );
  });

  it('leaves command and args untouched when shell is not enabled', async () => {
    const xMock = vi.fn(() => Promise.resolve({ exitCode: 0, stdout: '', stderr: '' }));
    vi.doMock('tinyexec', () => ({ x: xMock, xSync: vi.fn() }));
    vi.resetModules();

    const { spawnProcess } = await import('../child-process.js');
    spawnProcess('git', ['commit', '-m', 'message with spaces']);

    expect(xMock).toHaveBeenCalledWith(
      'git',
      ['commit', '-m', 'message with spaces'],
      expect.objectContaining({ nodeOptions: expect.objectContaining({ shell: false }) })
    );
  });

  it('joins command and args for xSync when shell is true (execSync)', async () => {
    const xSyncMock = vi.fn(() => ({ exitCode: 0, stdout: '', stderr: '' }));
    vi.doMock('tinyexec', () => ({ x: vi.fn(), xSync: xSyncMock }));
    vi.resetModules();

    const { execSync } = await import('../child-process.js');
    execSync('echo', ['$FOO', 'bar'], { shell: true });

    expect(xSyncMock).toHaveBeenCalledWith('echo $FOO bar', [], expect.objectContaining({ nodeOptions: expect.objectContaining({ shell: true }) }));
  });

  it('disables tinyexec nodePath (PATH prepending) by default to avoid shadowing the real PATH', async () => {
    const xMock = vi.fn(() => Promise.resolve({ exitCode: 0, stdout: '', stderr: '' }));
    vi.doMock('tinyexec', () => ({ x: xMock, xSync: vi.fn() }));
    vi.resetModules();

    const { spawnProcess } = await import('../child-process.js');
    spawnProcess('git', ['status']);

    expect(xMock).toHaveBeenCalledWith('git', ['status'], expect.objectContaining({ nodePath: false }));
  });

  it('allows opting back into tinyexec nodePath when explicitly requested', async () => {
    const xMock = vi.fn(() => Promise.resolve({ exitCode: 0, stdout: '', stderr: '' }));
    vi.doMock('tinyexec', () => ({ x: xMock, xSync: vi.fn() }));
    vi.resetModules();

    const { spawnProcess } = await import('../child-process.js');
    spawnProcess('git', ['status'], { nodePath: true });

    expect(xMock).toHaveBeenCalledWith('git', ['status'], expect.objectContaining({ nodePath: true }));
  });
});
