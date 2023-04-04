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

let watchAddHandler;
let watchAddDirHandler;
let watchUnlinkHandler;
let watchUnlinkDirHandler;
let watchChangeHandler;
let watchErrorHandler;
const closeMock = vi.fn();
const watchMock = vi.fn().mockImplementation(() => ({
  close: closeMock,
  on: vi.fn().mockImplementation(function (this, event, handler) {
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
}));
vi.mock('chokidar', () => ({
  default: {
    watch: watchMock,
  },
}));

// also point to the local watch command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/watch', async () => await vi.importActual<any>('../watch-command.js'));

// vi.useFakeTimers({ timerLimit: 100 });

import mockStdin from 'mock-stdin';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Mock } from 'vitest';
import yargParser from 'yargs-parser';

// make sure to import the output mock
import { WatchCommandOption } from '@lerna-lite/core';

// mocked modules
import { spawn, spawnStreaming } from '@lerna-lite/core';

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { normalizeRelativeDir } from '@lerna-test/helpers';
import { factory, WatchCommand } from '../index.js';
import cliWatchCommands from '../../../cli/src/cli-commands/cli-watch-commands.js';
const lernaWatch = commandRunner(cliWatchCommands);
const initFixture = initFixtureFactory(__dirname);

// assertion helpers
const calledInPackages = () => (spawn as Mock).mock.calls.map(([, , opts]) => basename(opts.cwd));
const watchInPackagesStreaming = (testDir) =>
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
  args['logLevel'] = 'silent';
  return argv as any;
};

describe('Watch Command', () => {
  const stdinIsTTY = process.stdin.isTTY;
  const stdoutIsTTY = process.stdout.isTTY;
  const stdin = mockStdin.stdin();

  beforeEach(() => {
    process.stdin.isTTY = true;
    process.stdout.isTTY = true;
  });

  afterEach(() => {
    process.stdin.isTTY = stdinIsTTY;
    process.stdout.isTTY = stdoutIsTTY;
    process.exitCode = undefined;
  });

  describe('in a basic repo', () => {
    // working dir is never mutated
    let testDir;

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
      } catch (err) {
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

    it('should take glob input option, without slash prefix, and expect it to be appended to the file path being watch by chokidar', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--glob', 'src/**/*.{ts,tsx}', '--', 'lerna run build');

      expect(watchMock).toHaveBeenCalledWith(
        [join(testDir, 'packages/package-1', '/src/**/*.{ts,tsx}'), join(testDir, 'packages/package-2', '/src/**/*.{ts,tsx}')],
        {
          ignored: ['**/.git/**', '**/dist/**', '**/node_modules/**'],
          ignoreInitial: true,
          ignorePermissionErrors: true,
          persistent: true,
        }
      );
    });

    it('should take glob input option, with slash prefix, and expect same appended to the file path being watch by chokidar', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--glob', '/src/**/*.{ts,tsx}', '--', 'lerna run build');

      expect(watchMock).toHaveBeenCalledWith(
        [join(testDir, 'packages/package-1', '/src/**/*.{ts,tsx}'), join(testDir, 'packages/package-2', '/src/**/*.{ts,tsx}')],
        {
          ignored: ['**/.git/**', '**/dist/**', '**/node_modules/**'],
          ignoreInitial: true,
          ignorePermissionErrors: true,
          persistent: true,
        }
      );
    });

    it('should be able to take --await-write-finish options as a boolean', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--await-write-finish', '--', 'lerna run build');

      expect(watchMock).toHaveBeenCalledWith([join(testDir, 'packages/package-1'), join(testDir, 'packages/package-2')], {
        ignored: ['**/.git/**', '**/dist/**', '**/node_modules/**'],
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
        awaitWriteFinish: true,
      });
    });

    it('should take options prefixed with "awf" (awfPollInterval) and transform them into a valid chokidar "awaitWriteFinish" option', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--awf-poll-interval', '500', '--', 'lerna run build');

      expect(watchMock).toHaveBeenCalledWith([join(testDir, 'packages/package-1'), join(testDir, 'packages/package-2')], {
        ignored: ['**/.git/**', '**/dist/**', '**/node_modules/**'],
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
        awaitWriteFinish: { pollInterval: 500 },
      });
    });

    it('should take options prefixed with "awf" (awfStabilityThreshold) and transform them into a valid chokidar "awaitWriteFinish" option', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--awf-stability-threshold', '275', '--', 'lerna run build');

      expect(watchMock).toHaveBeenCalledWith([join(testDir, 'packages/package-1'), join(testDir, 'packages/package-2')], {
        ignored: ['**/.git/**', '**/dist/**', '**/node_modules/**'],
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
        awaitWriteFinish: { stabilityThreshold: 275 },
      });
    });

    it('should execute change watch callback only in the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchChangeHandler('change', join(testDir, 'packages/package-2/some-file.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/some-file.ts'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute change watch callback with --stream in the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--stream', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchChangeHandler('change', join(testDir, 'packages/package-2/some-file.ts'));

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
            LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/some-file.ts'),
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
      watchChangeHandler('change', join(testDir, 'packages/package-2/file-1.ts'));
      await watchChangeHandler('change', join(testDir, 'packages/package-2/some-file.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: [join(testDir, 'packages/package-2/file-1.ts'), join(testDir, 'packages/package-2/some-file.ts')].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute change watch callback with custom file delimiter when defined', async () => {
      // prettier-ignore
      await lernaWatch(testDir)('--debounce', '0', '--file-delimiter', ';;', '--', 'echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES');
      watchChangeHandler('change', join(testDir, 'packages/package-2/file-1.ts'));
      await watchChangeHandler('change', join(testDir, 'packages/package-2/some-file.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME $LERNA_FILE_CHANGES', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: [join(testDir, 'packages/package-2/file-1.ts'), join(testDir, 'packages/package-2/some-file.ts')].join(';;'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute watch add callback only on the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchAddHandler('add', join(testDir, 'packages/package-2/some-file.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/some-file.ts'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute watch add callback only the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchAddDirHandler('addDir', join(testDir, 'packages/package-2/some-folder'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/some-folder'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute watch add callback only the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchUnlinkHandler('unlink', join(testDir, 'packages/package-2/some-file.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/some-file.ts'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute watch add callback only the given scope', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      await watchUnlinkDirHandler('unlinkDir', join(testDir, 'packages/package-2/some-folder'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: join(testDir, 'packages/package-2/some-folder'),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute watch callback only the given scoped package', async () => {
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');

      watchAddHandler('add', join(testDir, 'packages/package-1/my-file.ts'));
      watchAddHandler('add', join(testDir, 'packages/package-2/new-file-1.ts'));
      watchUnlinkHandler('unlink', join(testDir, 'packages/package-2/new-file-1.ts'));
      watchAddDirHandler('addDir', join(testDir, 'packages/package-2/new-folder'));
      watchUnlinkDirHandler('unlinkDir', join(testDir, 'packages/package-2/new-folder'));
      await watchChangeHandler('change', join(testDir, 'packages/package-2/some-file.ts'));

      expect(calledInPackages()).toEqual(['package-2']);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({ name: 'package-2' }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: [
            join(testDir, 'packages/package-2/new-file-1.ts'),
            join(testDir, 'packages/package-2/new-folder'),
            join(testDir, 'packages/package-2/some-file.ts'),
          ].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute watch multiple callbacks that were queued on multiple packages', async () => {
      // prettier-ignore
      await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-{1,2}', '--', 'echo $LERNA_PACKAGE_NAME && Promise.resolve(true)');

      watchAddHandler('add', join(testDir, 'packages/package-2/new-file-1.ts'));
      watchUnlinkHandler('unlink', join(testDir, 'packages/package-2/new-file-1.ts'));
      watchAddDirHandler('addDir', join(testDir, 'packages/package-2/new-folder'));
      watchUnlinkDirHandler('unlinkDir', join(testDir, 'packages/package-2/new-folder'));
      watchChangeHandler('change', join(testDir, 'packages/package-2/some-file.ts'));
      watchChangeHandler('addDir', join(testDir, 'packages/package-1/src'));
      watchChangeHandler('change', join(testDir, 'packages/package-1/src/some-file-88.ts'));
      await watchChangeHandler('change', join(testDir, 'packages/package-1/src/file-2.ts'));

      expect(calledInPackages()).toEqual(['package-2', 'package-1']);
      expect(spawn).toHaveBeenCalledTimes(2);
      expect(spawn).toHaveBeenCalledWith('echo $LERNA_PACKAGE_NAME && Promise.resolve(true)', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({ name: 'package-2' }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: [
            join(testDir, 'packages/package-2/new-file-1.ts'),
            join(testDir, 'packages/package-2/new-folder'),
            join(testDir, 'packages/package-2/some-file.ts'),
          ].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
      expect(spawn).toHaveBeenCalledWith('echo $LERNA_PACKAGE_NAME && Promise.resolve(true)', [], {
        cwd: join(testDir, 'packages/package-1'),
        pkg: expect.objectContaining({ name: 'package-1' }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-1',
          LERNA_FILE_CHANGES: [
            join(testDir, 'packages/package-1/src'),
            join(testDir, 'packages/package-1/src/some-file-88.ts'),
            join(testDir, 'packages/package-1/src/file-2.ts'),
          ].join(' '),
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should execute watch add callback and stop the watch process when typing "x" in the shell', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

      try {
        // prettier-ignore
        await lernaWatch(testDir)('--debounce', '0', '--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
        const promise = watchAddHandler('add', join(testDir, 'packages/package-2/some-file.ts'));
        stdin.send('x');
        stdin.end();
        await promise;
      } catch (e) {
        expect(mockExit).toHaveBeenCalled();
        mockExit.mockRestore();
      }
    });
  });
});
