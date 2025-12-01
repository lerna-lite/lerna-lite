import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WatchCommandOption } from '@lerna-lite/core';
import { spawn, spawnStreaming } from '@lerna-lite/core';
import { commandRunner, initFixtureFactory, normalizeRelativeDir } from '@lerna-test/helpers';
import { watch as chokidarWatch } from 'chokidar';
import mockStdin from 'mock-stdin';
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
  watch: vi.fn().mockImplementation(() => ({
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
  })),
}));

// also point to the local watch command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/watch', async () => await vi.importActual<any>('../watch-command.js'));

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const lernaWatch = commandRunner(cliWatchCommands);
const initFixture = initFixtureFactory(__dirname);

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
  afterEach(() => {
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

    it('rejects with execution error when calling chokidar on change event', async () => {
      vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      try {
        await lernaWatch(testDir)('--bail', '--', '--shaka', '--lakka');
        const nonZero = new Error('An actual non-zero, not git diff pager SIGPIPE');
        (nonZero as any).exitCode = 1;
        watchErrorHandler(nonZero);
      } catch (err: any) {
        expect(err.message).toBe('An actual non-zero, not git diff pager SIGPIPE');
      }
    });

    it('should ignore execution errors with --no-bail', async () => {
      vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);

      await lernaWatch(testDir)('--no-bail', '--', 'lerna run --shaka', '--lakka');
      const nonZero = new Error('An actual non-zero, not git diff pager SIGPIPE');
      (nonZero as any).exitCode = 1;
      watchErrorHandler(nonZero);

      expect(process.exitCode).toBe(1);

      // reset exit code
      process.exitCode = undefined;
    });

    it('should take glob input option, without slash prefix, and expect it to be watched by chokidar', async () => {
      const command = new WatchCommand(
        createArgv(testDir, '--debounce', '0', '--glob', '**/*.{ts,tsx}', '--', 'lerna run build')
      );
      await command;

      expect(chokidarWatch).toHaveBeenCalledWith(['packages/package-1/', 'packages/package-2/'], {
        cwd: testDir,
        ignored: [expect.any(Function), expect.any(Function), expect.any(Function)],
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
      });

      expect(command.watchedFiles.has('packages/package-1/file-1.ts')).toBeTruthy();
      expect(command.watchedFiles.has('packages/package-2/file-2.ts')).toBeTruthy();
      expect(command.watchedFiles.has('packages/package-1/package.json')).toBeFalsy();
      expect(command.watchedFiles.has('packages/package-2/package.json')).toBeFalsy();
    });

    it('should take glob input option, with slash prefix, and still expect it to be watched by chokidar', async () => {
      const command = new WatchCommand(
        createArgv(testDir, '--debounce', '0', '--glob', '/**/*.{ts,tsx}', '--', 'lerna run build')
      );
      await command;

      expect(chokidarWatch).toHaveBeenCalledWith(['packages/package-1/', 'packages/package-2/'], {
        cwd: testDir,
        ignored: [expect.any(Function), expect.any(Function), expect.any(Function)],
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
      });

      expect(command.watchedFiles.has('packages/package-1/file-1.ts')).toBeTruthy();
      expect(command.watchedFiles.has('packages/package-2/file-2.ts')).toBeTruthy();
      expect(command.watchedFiles.has('packages/package-1/package.json')).toBeFalsy();
      expect(command.watchedFiles.has('packages/package-2/package.json')).toBeFalsy();
    });

    it('should be able to take --await-write-finish options as a boolean', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--await-write-finish', '--', 'lerna run build');

      expect(chokidarWatch).toHaveBeenCalledWith(['packages/package-1/', 'packages/package-2/'], {
        cwd: testDir,
        ignored: [expect.any(Function), expect.any(Function), expect.any(Function)],
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
        awaitWriteFinish: true,
      });
    });

    it('should take options prefixed with "awf" (awfPollInterval) and transform them into a valid chokidar "awaitWriteFinish" option', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--awf-poll-interval', '500', '--', 'lerna run build');

      expect(chokidarWatch).toHaveBeenCalledWith(['packages/package-1/', 'packages/package-2/'], {
        cwd: testDir,
        ignored: [expect.any(Function), expect.any(Function), expect.any(Function)],
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
        awaitWriteFinish: { pollInterval: 500 },
      });
    });

    it('should take options prefixed with "awf" (awfStabilityThreshold) and transform them into a valid chokidar "awaitWriteFinish" option', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--awf-stability-threshold', '275', '--', 'lerna run build');

      expect(chokidarWatch).toHaveBeenCalledWith(['packages/package-1/', 'packages/package-2/'], {
        cwd: testDir,
        ignored: [expect.any(Function), expect.any(Function), expect.any(Function)],
        ignoreInitial: true,
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
          LERNA_FILE_CHANGES: [
            join(testDir, 'packages/package-2/package.json'),
            join(testDir, 'packages/package-2/file-2.ts'),
          ].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute change watch callback with custom file delimiter when defined', async () => {
      await lernaWatch(testDir)(
        '--debounce',
        '0',
        '--file-delimiter',
        ';;',
        '--',
        'echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES'
      );
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
          LERNA_FILE_CHANGES: [
            join(testDir, 'packages/package-2/package.json'),
            join(testDir, 'packages/package-2/file-2.ts'),
          ].join(';;'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should ignore files defined via --ignored glob pattern while still executing watch callback for other changes', async () => {
      await lernaWatch(testDir)(
        '--debounce',
        '0',
        '--ignored',
        '**/*.json',
        '--',
        'echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES'
      );
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
          LERNA_FILE_CHANGES: [
            join(testDir, 'packages/package-2/file-2.ts'),
            join(testDir, 'packages/package-2/package.json'),
          ].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
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
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/file-2.ts'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
      expect(spawn).toHaveBeenCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-1'),
        pkg: expect.objectContaining({ name: 'package-1' }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-1',
          LERNA_FILE_CHANGES: [
            join(testDir, 'packages/package-1/package.json'),
            join(testDir, 'packages/package-1/file-1.ts'),
          ].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute watch add callback and stop the watch process when ending the process (Ctrl+C) in the shell', async () => {
      const stdin = mockStdin.stdin();
      const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      const promise = watchAddHandler('add', join(testDir, 'packages/package-2/file-2.ts'));
      stdin.end();
      await promise;

      expect(mockExit).toHaveBeenCalled();
      mockExit.mockRestore();
    });
  });
});
