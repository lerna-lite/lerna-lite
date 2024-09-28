import pc from 'picocolors';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { log } from '@lerna-lite/npmlog';

import { execPackageManager, execPackageManagerSync } from '../exec-package-manager.js';
import { exec, execSync, getChildProcessCount } from '../../child-process.js';
import { Package } from '../../package.js';

vi.mock('../../child-process', async () => ({
  ...(await vi.importActual<any>('../../child-process')),
  exec: vi.fn(),
  execSync: vi.fn(),
  getChildProcessCount: (await vi.importActual<any>('../../child-process')).getChildProcessCount,
}));

const execActual = (await vi.importActual<any>('../../child-process')).exec;
const execSyncActual = (await vi.importActual<any>('../../child-process')).execSync;

describe('.execPackageManagerSync()', () => {
  beforeEach(() => {
    process.env = {};
  });

  describe('mock child processes', () => {
    it('calls execSync without corepack when disabled', () => {
      execPackageManagerSync('echo', ['execPackageManagerSync']);

      expect(execSync).toHaveBeenCalledWith('echo', ['execPackageManagerSync'], undefined, false);
    });

    it('calls execSync with corepack when enabled', () => {
      Object.assign({}, process.env);
      process.env.COREPACK_ROOT = 'pnpm';

      execPackageManagerSync('echo', ['execPackageManagerSync']);

      expect(execSync).toHaveBeenCalledWith('corepack', ['echo', 'execPackageManagerSync'], undefined, false);
    });
  });

  describe('import actual child processes', () => {
    beforeEach(() => {
      (execSync as Mock).mockImplementationOnce(execSyncActual);
    });

    it('should execute a command in a child process and return the result', () => {
      expect(execPackageManagerSync('echo', ['execPackageManagerSync'])).toContain(`execPackageManagerSync`);
    });

    it('should execute a command in dry-run and log the command', () => {
      const logSpy = vi.spyOn(log, 'info');
      execPackageManagerSync('echo', ['execPackageManagerSync'], undefined, true);
      expect(logSpy).toHaveBeenCalledWith(pc.bold(pc.magenta('[dry-run] >')), 'echo execPackageManagerSync');
    });

    it('does not error when stdout is ignored', () => {
      expect(() => execPackageManagerSync('echo', ['ignored'], { stdio: 'ignore' })).not.toThrow();
    });
  });
});

describe('.execPackageManager()', () => {
  beforeEach(() => {
    process.env = {};
  });

  describe('mock child processes', () => {
    it('calls exec without corepack when disabled', () => {
      execPackageManager('echo', ['execPackageManager']);

      expect(exec).toHaveBeenCalledWith('echo', ['execPackageManager'], undefined, false);
    });

    it('calls exec with corepack when enabled', () => {
      Object.assign({}, process.env);
      process.env.COREPACK_ROOT = 'pnpm';

      execPackageManager('echo', ['execPackageManager']);

      expect(exec).toHaveBeenCalledWith('corepack', ['echo', 'execPackageManager'], undefined, false);
    });
  });

  describe('import actual child processes', () => {
    beforeEach(() => {
      (exec as Mock).mockImplementationOnce(execActual);
    });

    it('returns an execa Promise', async () => {
      const { stderr, stdout } = (await execPackageManager('echo', ['foo'])) as any;

      expect(stderr).toBe('');
      expect(stdout).toContain(`foo`);
    });

    it('should execute a command in dry-run and log the command', () => {
      const logSpy = vi.spyOn(log, 'info');
      execPackageManager('echo', ['exec'], undefined, true);
      expect(logSpy).toHaveBeenCalledWith(pc.bold(pc.magenta('[dry-run] >')), 'echo exec');
    });

    it('rejects on undefined command', async () => {
      const result = execPackageManager('nowImTheModelOfAModernMajorGeneral', undefined as any);

      await expect(result).rejects.toThrow(/\bnowImTheModelOfAModernMajorGeneral\b/);
      expect(getChildProcessCount()).toBe(0);
    });

    it('decorates opts.pkg on error if caught', async () => {
      const result = execPackageManager('theVeneratedVirginianVeteranWhoseMenAreAll', ['liningUpToPutMeUpOnAPedestal'], {
        pkg: { name: 'hamilton' } as Package,
      });

      await expect(result).rejects.toThrow(
        expect.objectContaining({
          pkg: { name: 'hamilton' },
        })
      );
    });
  });
});
