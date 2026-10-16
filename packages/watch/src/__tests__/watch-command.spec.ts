import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

import type { WatchCommandOption } from '@lerna-lite/core';
import * as core from '@lerna-lite/core';
import { spawn, spawnStreaming } from '@lerna-lite/core';
import { commandRunner, initFixtureFactory, normalizeRelativeDir } from '@lerna-test/helpers';
import { watch as chokidarWatch } from 'chokidar';
import { afterEach, beforeAll, describe, expect, it, vi, type Mock } from 'vitest';
import yargParser from 'yargs-parser';

import cliWatchCommands from '../../../cli/src/cli-commands/cli-watch-commands.js';
import { factory, WatchCommand } from '../index.js';

// mocked modules
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  spawn: vi.fn(() => Promise.resolve({ exitCode: 0 })),
  spawnStreaming: vi.fn(() => Promise.resolve({ exitCode: 0 })),
  runTopologically: (await vi.importActual<any>('../../../core/src/utils/run-topologically')).runTopologically,
  QueryGraph: (await vi.importActual<any>('../../../core/src/utils/query-graph')).QueryGraph,
}));

let watchAddHandler: any;
let watchAddDirHandler: any;
let watchUnlinkHandler: any;
let watchUnlinkDirHandler: any;
let watchChangeHandler: any;
let watchErrorHandler: any;
const { closeMock } = vi.hoisted(() => ({ closeMock: vi.fn() }));

vi.mock('chokidar', () => ({
  watch: vi.fn().mockImplementation((folders: string[]) => ({
    close: closeMock,
    on: vi.fn().mockImplementation(function (this: any, event: string, handler: Function) {
      switch (event) {
        case 'error':
          watchErrorHandler = handler;
          break;
        case 'all':
        default:
          watchAddHandler = handler;
          watchAddDirHandler = handler;
          watchUnlinkHandler = handler;
          watchUnlinkDirHandler = handler;
          watchChangeHandler = handler;
          watchErrorHandler = handler;
          break;
      }
      return this;
    }),
    once: vi.fn().mockImplementation(function (this: any, event: string, handler: Function) {
      if (event === 'ready') {
        queueMicrotask(() => {
          for (const folder of folders) {
            for (const entry of readdirSync(folder, { recursive: true, withFileTypes: true })) {
              if (entry.isFile()) {
                watchAddHandler('add', join(entry.parentPath, entry.name));
              }
            }
          }
          handler();
        });
      }
      return this;
    }),
  })),
}));

// also point to the local watch command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/watch', async () => await vi.importActual<any>('../watch-command.js'));

// helpers
const lernaWatch = commandRunner(cliWatchCommands);
const initFixture = initFixtureFactory(import.meta.dirname);

// assertion helpers
const calledInPackages = () => (spawn as Mock).mock.calls.map(([, , opts]) => basename(opts.cwd));
const watchInPackagesStreaming = (testDir: string) =>
  (spawnStreaming as Mock).mock.calls.reduce((arr, [command, params, opts, prefix]) => {
    const dir = normalizeRelativeDir(testDir, opts.cwd);
    arr.push([dir, command, `(prefix: ${prefix})`].concat(params).join(' '));
    return arr;
  }, []);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('watch');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--cmd=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  args.forEach((arg, idx) => {
    if (arg === '--' && args[idx + 1]) {
      argv.command = args[idx + 1];
    }
  });
  (args as any)['logLevel'] = 'silent';
  return argv as any;
};

describe('Watch Command', () => {
  const signalListeners = process.listeners('SIGINT');
  const termListeners = process.listeners('SIGTERM');
  const endListeners = process.stdin.listeners('end');
  afterEach(() => {
    for (const listener of process.listeners('SIGINT')) {
      if (!signalListeners.includes(listener)) process.off('SIGINT', listener);
    }
    for (const listener of process.listeners('SIGTERM')) {
      if (!termListeners.includes(listener)) process.off('SIGTERM', listener);
    }
    for (const listener of process.stdin.listeners('end')) {
      if (!endListeners.includes(listener)) process.stdin.off('end', listener);
    }
    vi.restoreAllMocks();
    vi.mocked(spawn).mockReset().mockResolvedValue({ exitCode: 0 });
    vi.mocked(spawnStreaming).mockReset().mockResolvedValue({ exitCode: 0 });
    process.exitCode = undefined;
  });

  describe('in a basic repo', () => {
    // working dir is never mutated
    let testDir: string;

    beforeAll(async () => {
      testDir = await initFixture('basic');
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should complain if invoked without command', async () => {
      const command = lernaWatch(testDir)('--bail');

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('should complain if invoked without command using factory', async () => {
      const command = factory(createArgv(testDir, '', '--watch-added-file') as WatchCommandOption);

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('should complain if invoked without command using WatchCommand class', async () => {
      const command = new WatchCommand(createArgv(testDir) as WatchCommandOption);

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('closes the watcher on filesystem errors without throwing from the event callback', async () => {
      await lernaWatch(testDir)('--bail', '--', 'echo');
      watchErrorHandler(Object.assign(new Error('watch failed'), { code: 'ENOSPC' }));
      await vi.waitFor(() => expect(closeMock).toHaveBeenCalledOnce());
      expect(process.exitCode).toBe(1);
    });

    it('handles watcher creation failures through the command error handler', async () => {
      vi.mocked(chokidarWatch).mockImplementationOnce(() => {
        throw new Error('watch creation failed');
      });

      await new WatchCommand(createArgv(testDir, '--debounce', '0', '--', 'echo'));

      expect(process.exitCode).toBe(1);
    });

    it('closes on filesystem errors even with --no-bail', async () => {
      await lernaWatch(testDir)('--no-bail', '--', 'lerna run --shaka', '--lakka');
      const nonZero = new Error('An actual non-zero, not git diff pager SIGPIPE');
      (nonZero as any).exitCode = 1;
      watchErrorHandler(nonZero);
      await vi.waitFor(() => expect(closeMock).toHaveBeenCalledOnce());
      expect(process.exitCode).toBe(1);

      // reset exit code
      process.exitCode = undefined;
    });

    it('should set shell=true by default', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchChangeHandler('change', join(testDir, 'packages/package-2/file-2.ts'));
      expect(spawn).toHaveBeenLastCalledWith(
        'echo $LERNA_PACKAGE_NAME',
        [],
        expect.objectContaining({
          shell: true,
        })
      );
    });

    it('should set shell=false with --no-shell', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--no-shell', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchChangeHandler('change', join(testDir, 'packages/package-2/file-2.ts'));
      expect(spawn).toHaveBeenLastCalledWith(
        'echo $LERNA_PACKAGE_NAME',
        [],
        expect.objectContaining({
          shell: false,
        })
      );
    });

    it('should take glob input option, without slash prefix, and expect it to be watched by chokidar', async () => {
      const command = new WatchCommand(createArgv(testDir, '--debounce', '0', '--glob', '**/*.{ts,tsx}', '--', 'lerna run build'));
      await command;

      expect(chokidarWatch).toHaveBeenCalledWith([join(testDir, 'packages/package-1'), join(testDir, 'packages/package-2')], {
        cwd: testDir,
        ignored: [expect.any(Function)],
        ignoreInitial: false,
        ignorePermissionErrors: true,
        persistent: true,
      });

      expect(command.watchedFiles.has('packages/package-1/file-1.ts')).toBeTruthy();
      expect(command.watchedFiles.has('packages/package-2/file-2.ts')).toBeTruthy();
      expect(command.watchedFiles.has('packages/package-1/package.json')).toBeFalsy();
      expect(command.watchedFiles.has('packages/package-2/package.json')).toBeFalsy();
    });

    it('should take glob input option, with slash prefix, and still expect it to be watched by chokidar', async () => {
      const command = new WatchCommand(createArgv(testDir, '--debounce', '0', '--glob', '/**/*.{ts,tsx}', '--', 'lerna run build'));
      await command;

      expect(chokidarWatch).toHaveBeenCalledWith([join(testDir, 'packages/package-1'), join(testDir, 'packages/package-2')], {
        cwd: testDir,
        ignored: [expect.any(Function)],
        ignoreInitial: false,
        ignorePermissionErrors: true,
        persistent: true,
      });

      expect(command.watchedFiles.has('packages/package-1/file-1.ts')).toBeTruthy();
      expect(command.watchedFiles.has('packages/package-2/file-2.ts')).toBeTruthy();
      expect(command.watchedFiles.has('packages/package-1/package.json')).toBeFalsy();
      expect(command.watchedFiles.has('packages/package-2/package.json')).toBeFalsy();
    });

    it('should handle no packages to watch (empty package list)', async () => {
      // construct command directly and simulate no filtered packages
      const command = new WatchCommand(createArgv(testDir, '--debounce', '0', '--', 'echo') as WatchCommandOption);
      (command as any).project = { rootPath: testDir };
      // ensure getFilteredPackages returns an empty array so initialize() doesn't override our value
      vi.spyOn(core as any, 'getFilteredPackages').mockResolvedValueOnce([]);
      (command as any)._filteredPackages = [];

      await command;

      expect(chokidarWatch).not.toHaveBeenCalled();
      expect(command.watchedFiles.size).toBe(0);
    });

    it('should be able to take --await-write-finish options as a boolean', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--await-write-finish', '--', 'lerna run build');

      expect(chokidarWatch).toHaveBeenCalledWith([join(testDir, 'packages/package-1'), join(testDir, 'packages/package-2')], {
        cwd: testDir,
        ignored: [expect.any(Function)],
        ignoreInitial: false,
        ignorePermissionErrors: true,
        persistent: true,
        awaitWriteFinish: true,
      });
    });

    it('should take options prefixed with "awf" (awfPollInterval) and transform them into a valid chokidar "awaitWriteFinish" option', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--awf-poll-interval', '500', '--', 'lerna run build');

      expect(chokidarWatch).toHaveBeenCalledWith([join(testDir, 'packages/package-1'), join(testDir, 'packages/package-2')], {
        cwd: testDir,
        ignored: [expect.any(Function)],
        ignoreInitial: false,
        ignorePermissionErrors: true,
        persistent: true,
        awaitWriteFinish: { pollInterval: 500 },
      });
    });

    it('should take options prefixed with "awf" (awfStabilityThreshold) and transform them into a valid chokidar "awaitWriteFinish" option', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--awf-stability-threshold', '275', '--', 'lerna run build');

      expect(chokidarWatch).toHaveBeenCalledWith([join(testDir, 'packages/package-1'), join(testDir, 'packages/package-2')], {
        cwd: testDir,
        ignored: [expect.any(Function)],
        ignoreInitial: false,
        ignorePermissionErrors: true,
        persistent: true,
        awaitWriteFinish: { stabilityThreshold: 275 },
      });
    });

    it('should execute change watch callback only in the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchChangeHandler('change', join(testDir, 'packages/package-2/file-2.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/file-2.ts'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
        nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
      });
    });

    it('should execute change watch callback with --stream in the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--stream', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchChangeHandler('change', join(testDir, 'packages/package-2/file-2.ts'));

      expect(watchInPackagesStreaming(testDir)).toEqual(['packages/package-2 echo $LERNA_PACKAGE_NAME (prefix: package-2)']);
      expect(spawnStreaming).toHaveBeenCalledTimes(1);
      expect(spawnStreaming).toHaveBeenLastCalledWith(
        'echo $LERNA_PACKAGE_NAME',
        [],
        {
          cwd: join(testDir, 'packages/package-2'),
          pkg: expect.objectContaining({
            name: 'package-2',
          }),
          env: expect.objectContaining({
            LERNA_PACKAGE_NAME: 'package-2',
            LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/file-2.ts'),
          }),
          extendEnv: false,
          reject: true,
          shell: true,
          buffer: false,
          nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
        },
        'package-2'
      );
    });

    it('should execute change watch callback with default whitespace file delimiter', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--', 'echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES');
      watchChangeHandler('change', join(testDir, 'packages/package-2/package.json'));
      await watchChangeHandler('change', join(testDir, 'packages/package-2/file-2.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: [join(testDir, 'packages/package-2/package.json'), join(testDir, 'packages/package-2/file-2.ts')].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
        nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
      });
    });

    it('should execute change watch callback with custom file delimiter when defined', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--file-delimiter', ';;', '--', 'echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES');
      watchChangeHandler('change', join(testDir, 'packages/package-2/package.json'));
      await watchChangeHandler('change', join(testDir, 'packages/package-2/file-2.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: [join(testDir, 'packages/package-2/package.json'), join(testDir, 'packages/package-2/file-2.ts')].join(';;'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
        nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
      });
    });

    it('should ignore files defined via --ignored glob pattern while still executing watch callback for other changes', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--ignored', '**/*.json', '--', 'echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES');
      watchChangeHandler('change', join(testDir, 'packages/package-2/package.json'));
      await watchChangeHandler('change', join(testDir, 'packages/package-2/file-2.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({ name: 'package-2' }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/file-2.ts'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
        nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
      });
    });

    it('should execute watch add callback only on the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchAddHandler('add', join(testDir, 'packages/package-2/package.json'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/package.json'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
        nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
      });
    });

    it('should execute watch callback only the given scoped package', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');

      watchAddHandler('add', join(testDir, 'packages/package-1/package.json'));
      watchAddHandler('add', join(testDir, 'packages/package-2/file-2.ts'));
      watchUnlinkHandler('unlink', join(testDir, 'packages/package-2/file-2.ts'));
      await watchChangeHandler('change', join(testDir, 'packages/package-2/package.json'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({ name: 'package-2' }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: [join(testDir, 'packages/package-2/file-2.ts'), join(testDir, 'packages/package-2/package.json')].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
        nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
      });
    });

    it('should execute watch multiple callbacks that were queued on multiple packages', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-{1,2}', '--', 'echo $LERNA_PACKAGE_NAME');

      watchAddHandler('add', join(testDir, 'packages/package-2/new-file-1.ts'));
      watchUnlinkHandler('unlink', join(testDir, 'packages/package-2/new-file-1.ts'));
      watchAddDirHandler('addDir', join(testDir, 'packages/package-2/new-folder'));
      watchUnlinkDirHandler('unlinkDir', join(testDir, 'packages/package-2/new-folder'));
      watchChangeHandler('change', join(testDir, 'packages/package-2/file-2.ts'));
      watchChangeHandler('addDir', join(testDir, 'packages/package-1/src'));
      watchChangeHandler('change', join(testDir, 'packages/package-1/package.json'));
      await watchChangeHandler('change', join(testDir, 'packages/package-1/file-1.ts'));

      expect(calledInPackages()).toEqual(['package-2', 'package-1']);
      expect(spawn).toHaveBeenCalledTimes(2);
      expect(spawn).toHaveBeenCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({ name: 'package-2' }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: [join(testDir, 'packages/package-2/new-file-1.ts'), join(testDir, 'packages/package-2/file-2.ts')].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
        nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
      });
      expect(spawn).toHaveBeenCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-1'),
        pkg: expect.objectContaining({ name: 'package-1' }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-1',
          LERNA_FILE_CHANGES: [join(testDir, 'packages/package-1/package.json'), join(testDir, 'packages/package-1/file-1.ts')].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
        nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
      });
    });

    it('cancels pending work and removes its listeners on SIGINT', async () => {
      await lernaWatch(testDir)('--debounce', '100', '--scope', 'package-2', '--', 'echo');
      const pending = watchChangeHandler('change', 'packages/package-2/file-2.ts');
      const onSigint = process.listeners('SIGINT').find((fn) => !signalListeners.includes(fn))!;
      onSigint('SIGINT');
      await pending;
      expect(process.exitCode).toBe(130);
      expect(closeMock).toHaveBeenCalledOnce();
      expect(spawn).not.toHaveBeenCalled();
      expect(process.listeners('SIGINT')).toEqual(signalListeners);
      expect(process.listeners('SIGTERM')).toEqual(termListeners);
      expect(process.stdin.listeners('end')).toEqual(endListeners);
    });

    it('handles a rejected child command and stops with its exit code', async () => {
      vi.mocked(spawn).mockRejectedValueOnce(Object.assign(new Error('build failed'), { exitCode: 7 }));
      await lernaWatch(testDir)('--debounce', '0', '--', 'echo');
      await watchChangeHandler('change', 'packages/package-2/file-2.ts');
      expect(process.exitCode).toBe(7);
      expect(closeMock).toHaveBeenCalledOnce();
      await watchChangeHandler('change', 'packages/package-1/file-1.ts');
      expect(spawn).toHaveBeenCalledOnce();
    });

    it('records failed results with --no-bail and continues processing later changes', async () => {
      vi.mocked(spawn).mockResolvedValueOnce({ failed: true, exitCode: 7 });
      await lernaWatch(testDir)('--no-bail', '--debounce', '0', '--', 'echo');
      await watchChangeHandler('change', 'packages/package-2/file-2.ts');
      expect(process.exitCode).toBe(7);
      await watchChangeHandler('change', 'packages/package-1/file-1.ts');
      expect(calledInPackages()).toEqual(['package-2', 'package-1']);
      expect(closeMock).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(7);
    });

    it('continues after a spawn error with --no-bail', async () => {
      vi.mocked(spawn).mockRejectedValueOnce(Object.assign(new Error('not found'), { code: 'ENOENT' }));
      await lernaWatch(testDir)('--no-bail', '--debounce', '0', '--', 'echo');
      await watchChangeHandler('change', 'packages/package-2/file-2.ts');
      expect(process.exitCode).toBe(1);
      await watchChangeHandler('change', 'packages/package-1/file-1.ts');
      expect(spawn).toHaveBeenCalledTimes(2);
      expect(closeMock).not.toHaveBeenCalled();
    });

    it('merges debounce promises and serializes changes received while a command runs', async () => {
      let finish!: (result: any) => void;
      vi.mocked(spawn).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      );
      await lernaWatch(testDir)('--debounce', '0', '--', 'echo');
      const first = watchChangeHandler('change', 'packages/package-2/file-2.ts');
      await vi.waitFor(() => expect(spawn).toHaveBeenCalledOnce());
      const second = watchChangeHandler('change', 'packages/package-2/file-2.ts');
      const third = watchChangeHandler('change', 'packages/package-1/file-1.ts');
      expect(first).toBe(second);
      expect(second).toBe(third);
      expect(spawn).toHaveBeenCalledOnce();
      finish({ exitCode: 0 });
      await Promise.all([first, second, third]);
      expect(calledInPackages()).toEqual(['package-2', 'package-2', 'package-1']);
    });

    it('uses directory boundaries and gives nested packages ownership of their files', async () => {
      const command: any = new WatchCommand(createArgv(testDir, '--debounce', '0', '--', 'echo'));
      await command;
      command._filteredPackages = [
        { name: 'nested', location: join(testDir, 'packages/foo/nested') },
        { name: 'foo', location: join(testDir, 'packages/foo') },
        { name: 'foobar', location: join(testDir, 'packages/foobar') },
      ];
      await watchChangeHandler('change', 'packages/foobar/new.ts');
      await watchChangeHandler('change', 'packages/foo/nested/new.ts');
      expect(calledInPackages()).toEqual(['foobar', 'nested']);
    });

    it('queues packages whose names also exist on Object.prototype', async () => {
      const command: any = new WatchCommand(createArgv(testDir, '--debounce', '0', '--', 'echo'));
      await command;
      command._filteredPackages = [{ name: 'constructor', location: join(testDir, 'packages/package-2') }];
      await watchChangeHandler('change', 'packages/package-2/file-2.ts');
      expect(vi.mocked(spawn).mock.calls[0][2]!.env!.LERNA_PACKAGE_NAME).toBe('constructor');
    });

    it('keeps both sides of a rename and removes deleted files from the inventory', async () => {
      const command = new WatchCommand(createArgv(testDir, '--debounce', '0', '--', 'echo'));
      await command;
      const added = watchAddHandler('add', 'packages/package-2/renamed.ts');
      const removed = watchUnlinkHandler('unlink', 'packages/package-2/file-2.ts');
      await Promise.all([added, removed]);
      const changes = vi.mocked(spawn).mock.calls[0][2]!.env!.LERNA_FILE_CHANGES;
      expect(changes).toBe([join(testDir, 'packages/package-2/renamed.ts'), join(testDir, 'packages/package-2/file-2.ts')].join(' '));
      expect(command.watchedFiles.has('packages/package-2/renamed.ts')).toBe(true);
      expect(command.watchedFiles.has('packages/package-2/file-2.ts')).toBe(false);
    });

    it('watches new dotfiles and drops inventory entries when a directory disappears', async () => {
      const command = new WatchCommand(createArgv(testDir, '--debounce', '0', '--', 'echo'));
      await command;
      await watchAddHandler('add', 'packages/package-2/new/.env');
      expect(command.watchedFiles.has('packages/package-2/new/.env')).toBe(true);
      watchUnlinkDirHandler('unlinkDir', 'packages/package-2/new');
      expect(command.watchedFiles.has('packages/package-2/new/.env')).toBe(false);
      expect(spawn).toHaveBeenCalledOnce();
    });

    it('prunes ignored folders and allows explicit overrides of the defaults', async () => {
      await lernaWatch(testDir)('--ignored', '!**/dist/**', '--debounce', '0', '--', 'echo');
      const options = vi.mocked(chokidarWatch).mock.calls[0][1]!;
      const ignored = (options.ignored as Function[])[0];
      expect(ignored(join(testDir, 'packages/package-2/node_modules'))).toBe(true);
      expect(ignored(join(testDir, 'packages/package-2/dist'))).toBe(false);
      await watchAddHandler('add', 'packages/package-2/dist/output.js');
      await watchAddHandler('add', 'packages/package-2/node_modules/dep/output.js');
      expect(spawn).toHaveBeenCalledOnce();
    });

    it('does not execute commands for the initial inventory by default', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--', 'echo');
      expect(spawn).not.toHaveBeenCalled();
    });

    it('can execute commands for the initial inventory when requested', async () => {
      await lernaWatch(testDir)('--no-ignore-initial', '--debounce', '0', '--', 'echo');
      // Await the shared batch without adding another file change.
      await vi.waitFor(() => expect(spawn).toHaveBeenCalledTimes(2));
    });

    it('makes repeated termination calls share cleanup and reports SIGTERM as 143', async () => {
      const command: any = new WatchCommand(createArgv(testDir, '--debounce', '0', '--', 'echo'));
      await command;
      const first = command.handleTermination(143);
      const second = command.handleTermination(130, 'SIGINT');
      expect(first).toBe(second);
      await first;
      expect(closeMock).toHaveBeenCalledOnce();
      expect(process.exitCode).toBe(143);
    });

    it('runs signal and stdin shutdown handlers and ignores errors after shutdown', async () => {
      const command: any = new WatchCommand(createArgv(testDir, '--debounce', '0', '--', 'echo'));
      await command;

      await command.changeEventListener('unknown/path');
      command._onSigterm();
      await vi.waitFor(() => expect(closeMock).toHaveBeenCalledOnce());
      command._onStdinEnd();
      await command.changeEventListener('packages/package-2/file-2.ts');
      await command.onError(new Error('late watcher error'), true);

      expect(process.exitCode).toBe(143);
    });

    it('settles queued work and reports a watcher close failure', async () => {
      const command: any = new WatchCommand(createArgv(testDir, '--debounce', '100', '--', 'echo'));
      await command;
      closeMock.mockRejectedValueOnce(new Error('close failed'));
      const queued = watchChangeHandler('change', 'packages/package-2/file-2.ts');
      await command.handleTermination();
      await queued;
      expect(process.exitCode).toBe(1);
      expect(spawn).not.toHaveBeenCalled();
    });
  });
});
