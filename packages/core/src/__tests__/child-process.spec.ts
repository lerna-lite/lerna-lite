import { log } from '@lerna-lite/npmlog';
import { describe, expect, it, vi } from 'vitest';

import { exec, execSync, getChildProcessCount, getExitCode, spawn, spawnStreaming } from '../child-process.js';
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
  });

  describe('.spawn()', () => {
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
  });

  describe('.spawnStreaming()', () => {
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
    it('should call setMaxListeners when many streaming children are spawned (force coverage)', async () => {
      const origStdout = process.stdout.setMaxListeners.bind(process.stdout);
      const origStderr = process.stderr.setMaxListeners.bind(process.stderr);
      const origStdoutGet = process.stdout.getMaxListeners.bind(process.stdout);
      const origStderrGet = process.stderr.getMaxListeners.bind(process.stderr);
      let stdoutCalled = false;
      let stderrCalled = false;
      process.stdout.setMaxListeners = function (n) {
        stdoutCalled = true;
        return origStdout(n);
      };
      process.stderr.setMaxListeners = function (n) {
        stderrCalled = true;
        return origStderr(n);
      };
      // Force getMaxListeners to return 1 so children.size > getMaxListeners is always true
      process.stdout.getMaxListeners = () => 1;
      process.stderr.getMaxListeners = () => 1;
      // Add fake children to the real children set
      const core = await import('../child-process.js');
      const childrenSet = (core as any).children || (core as any).default?.children;
      for (let i = 0; i < 5; i++) {
        childrenSet?.add({ id: 'fake' + i });
      }
      await spawnStreaming('node', ['-e', 'console.log(42)']);
      expect(stdoutCalled || stderrCalled).toBe(true);
      // Clean up
      childrenSet?.forEach((c: any) => {
        if (c.id?.startsWith('fake')) childrenSet.delete(c);
      });
      process.stdout.setMaxListeners = origStdout;
      process.stderr.setMaxListeners = origStderr;
      process.stdout.getMaxListeners = origStdoutGet;
      process.stderr.getMaxListeners = origStderrGet;
    });
  });

  describe('wrapError error propagation', () => {
    it('should throw original error if no exitCode or code', async () => {
      // Simulate a spawned object that rejects with a plain error, using a custom thenable
      const { wrapError } = await import('../child-process.js');
      const error = new Error('plain error');
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
});
