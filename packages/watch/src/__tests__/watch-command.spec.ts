// mocked modules
jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  Command: jest.requireActual('../../../core/src/command').Command,
  conf: jest.requireActual('../../../core/src/command').conf,
  spawn: jest.fn(() => Promise.resolve({ exitCode: 0 })),
  runTopologically: jest.requireActual('../../../core/src/utils/run-topologically').runTopologically,
  QueryGraph: jest.requireActual('../../../core/src/utils/query-graph').QueryGraph,
}));

jest.mock('@lerna-lite/optional-cmd-common', () => ({
  ...(jest.requireActual('@lerna-lite/optional-cmd-common') as any),
  ...jest.requireActual('../../../optional-cmd-common/src/lib/profiler'), // test with the real Profiler for test coverage as well
}));

let changeHandler;
let errorHandler;
const closeMock = jest.fn();
const watchImplementation = jest.fn().mockImplementation(() => ({
  close: closeMock,
  on: jest.fn().mockImplementation(function (this, event, handler) {
    if (event === 'error') {
      errorHandler = handler;
      // handler('some error');
    } else if (event === 'change') {
      changeHandler = handler;
    }
    return this;
  }),
}));
jest.mock('chokidar', () => ({ watch: watchImplementation }));

// also point to the local watch command so that all mocks are properly used even by the command-runner
jest.mock('@lerna-lite/watch', () => jest.requireActual('../watch-command'));

// jest.useFakeTimers({ timerLimit: 100 });

import path from 'path';
// import fs from 'fs-extra';
// import globby from 'globby';
import yargParser from 'yargs-parser';

// make sure to import the output mock
import { WatchCommandOption } from '@lerna-lite/core';

// mocked modules
import { spawn, spawnStreaming } from '@lerna-lite/core';

// helpers
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import { normalizeRelativeDir } from '@lerna-test/helpers';
import { factory, WatchCommand } from '../watch-command';
import cliWatchCommands from '../../../cli/src/cli-commands/cli-watch-commands';
const lernaWatch = commandRunner(cliWatchCommands);
const initFixture = initFixtureFactory(__dirname);

// assertion helpers
const calledInPackages = () => (spawn as jest.Mock).mock.calls.map(([, , opts]) => path.basename(opts.cwd));

const watchInPackagesStreaming = (testDir) =>
  (spawnStreaming as jest.Mock).mock.calls.reduce((arr, [command, params, opts, prefix]) => {
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
  args['logLevel'] = 'silent';
  return argv as any;
};

describe('Watch Command', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  describe('in a basic repo', () => {
    // working dir is never mutated
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture('basic');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should complain if invoked without command', async () => {
      const command = lernaWatch(testDir)('--bail');

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('should complain if invoked without command using factory', async () => {
      const command = factory(createArgv(testDir, '--watch-added-file') as WatchCommandOption);

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('should complain if invoked without command using WatchCommand class', async () => {
      const command = new WatchCommand(createArgv(testDir) as WatchCommandOption);

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('rejects with execution error when calling chokidar on change event', async () => {
      try {
        await lernaWatch(testDir)('--bail', '--', '--shaka', '--lakka');
        const nonZero = new Error('An actual non-zero, not git diff pager SIGPIPE');
        (nonZero as any).exitCode = 1;
        errorHandler(nonZero);
      } catch (err) {
        expect(err.message).toBe('An actual non-zero, not git diff pager SIGPIPE');
      }
    });

    it('should ignore execution errors with --no-bail', async () => {
      await lernaWatch(testDir)('--no-bail', '--', 'lerna run --shaka', '--lakka');
      const nonZero = new Error('An actual non-zero, not git diff pager SIGPIPE');
      (nonZero as any).exitCode = 1;
      errorHandler(nonZero);

      expect(process.exitCode).toBe(1);
    });

    it('should only include packages filtered by --scope', async () => {
      await lernaWatch(testDir)('--scope', 'package-2', '--', 'echo $LERNA_PACKAGE_NAME');
      await changeHandler(path.join(testDir, 'packages/package-2/some-file.ts'));

      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('echo $LERNA_PACKAGE_NAME', [], {
        cwd: path.join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_FILE_CHANGES: path.join(testDir, 'packages/package-2/some-file.ts'),
          LERNA_FILE_CHANGE_TYPE: 'change',
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });
  });
});
