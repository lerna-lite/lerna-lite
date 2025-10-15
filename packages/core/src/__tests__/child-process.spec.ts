import { log } from '@lerna-lite/npmlog';
import c from 'tinyrainbow';
import { describe, expect, it, vi } from 'vitest';
// file under test
import { exec, execSync, getChildProcessCount, getExitCode, spawn, spawnStreaming } from '../child-process.js';
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
      expect(execSync('echo', ['execSync'])).toContain(`execSync`);
    });

    it('should execute a command in dry-run and log the command', () => {
      const logSpy = vi.spyOn(log, 'info');
      execSync('echo', ['execSync'], undefined, true);
      expect(logSpy).toHaveBeenCalledWith(c.bold(c.magenta('[dry-run] >')), 'echo execSync');
    });

    it('does not error when stdout is ignored', () => {
      expect(() => execSync('echo', ['ignored'], { stdio: 'ignore' })).not.toThrow();
    });
  });

  describe('.exec()', () => {
    it('returns an execa Promise', async () => {
      const { stderr, stdout } = (await exec('echo', ['foo'])) as any;

      expect(stderr).toBe('');
      expect(stdout).toContain(`foo`);
    });

    it('should execute a command in dry-run and log the command', () => {
      const logSpy = vi.spyOn(log, 'info');
      exec('echo', ['exec'], undefined, true);
      expect(logSpy).toHaveBeenCalledWith(c.bold(c.magenta('[dry-run] >')), 'echo exec');
    });

    it('rejects on undefined command', async () => {
      const result = exec('nowImTheModelOfAModernMajorGeneral', undefined as any);

      await expect(result).rejects.toThrow(/\bnowImTheModelOfAModernMajorGeneral\b/);
      expect(getChildProcessCount()).toBe(0);
    });

    it('registers child processes that are created', async () => {
      const echoOne = exec('echo', ['one']);
      expect(getChildProcessCount()).toBe(1);

      const echoTwo = exec('echo', ['two']);
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
      const child = spawn('echo', ['-n']) as any;
      expect(child.stdio).toEqual([null, null, null]);

      const { exitCode, signal } = await child;
      expect(exitCode).toBe(0);
      expect(signal).toBe(undefined);
    });

    it('should execute a command in dry-run and log the command', () => {
      const logSpy = vi.spyOn(log, 'info');
      spawn('echo', ['-n'], undefined, true);
      expect(logSpy).toHaveBeenCalledWith(c.bold(c.magenta('[dry-run] >')), 'echo -n');
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
      const child = spawnStreaming('echo', ['-n']) as any;
      expect(child.stdio).toEqual([null, expect.anything(), expect.anything()]);

      const { exitCode, signal } = await child;
      expect(exitCode).toBe(0);
      expect(signal).toBe(undefined);
    });

    it('should execute a command in dry-run and log the command', async () => {
      const logSpy = vi.spyOn(log, 'info');

      await spawnStreaming('echo', ['-n'], { stdio: 'inherit' }, 'my-prefix', true);

      expect(logSpy).toHaveBeenCalledWith(c.bold(c.magenta('[dry-run] >')), 'echo -n');
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
});
