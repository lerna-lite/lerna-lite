import { afterEach, beforeAll, describe, expect, it, Mock, vi } from 'vitest';

// mocked modules
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  spawn: vi.fn(() => Promise.resolve({ exitCode: 0 })),
  spawnStreaming: vi.fn(() => Promise.resolve({ exitCode: 0 })),
  runTopologically: (await vi.importActual<any>('../../../core/src/utils/run-topologically')).runTopologically,
  QueryGraph: (await vi.importActual<any>('../../../core/src/utils/query-graph')).QueryGraph,
}));

vi.mock('@lerna-lite/profiler', async () => await vi.importActual<any>('../../../profiler/src/profiler'));

// also point to the local exec command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/exec', async () => await vi.importActual<any>('../exec-command'));

import { basename, dirname, join } from 'node:path';
import { pathExists, readJson } from 'fs-extra/esm';
import { globby } from 'globby';
import { fileURLToPath } from 'node:url';
import yargParser from 'yargs-parser';

// make sure to import the output mock
import { ExecCommandOption, logOutput } from '@lerna-lite/core';

// mocked modules
import { spawn, spawnStreaming } from '@lerna-lite/core';

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import { normalizeRelativeDir } from '@lerna-test/helpers';
import { factory, ExecCommand } from '../index';
import cliExecCommands from '../../../cli/src/cli-commands/cli-exec-commands';
const lernaExec = commandRunner(cliExecCommands);
const initFixture = initFixtureFactory(__dirname);

// assertion helpers
const calledInPackages = () => (spawn as Mock).mock.calls.map(([, , opts]) => basename(opts.cwd));

const execInPackagesStreaming = (testDir) =>
  (spawnStreaming as Mock).mock.calls.reduce((arr, [command, params, opts, prefix]) => {
    const dir = normalizeRelativeDir(testDir, opts.cwd);
    arr.push([dir, command, `(prefix: ${prefix})`].concat(params).join(' '));
    return arr;
  }, []);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('exec');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--cmd=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  args['logLevel'] = 'silent';
  return argv;
};

describe('ExecCommand', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  describe('in a basic repo', () => {
    // working dir is never mutated
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture('basic');
    });

    it('should complain if invoked without command', async () => {
      const command = lernaExec(testDir)('--parallel');

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('should complain if invoked without command using factory', async () => {
      const command = factory(createArgv(testDir, '--parallel') as ExecCommandOption);

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('should complain if invoked without command using ExecCommand class', async () => {
      const command = new ExecCommand(createArgv(testDir, '--parallel') as ExecCommandOption);

      await expect(command).rejects.toThrow('A command to execute is required');
    });

    it('rejects with execution error', async () => {
      vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);
      (spawn as Mock).mockImplementationOnce((cmd, args) => {
        const boom: any = new Error('execution error');

        boom.failed = true;
        boom.exitCode = 123;
        boom.command = [cmd].concat(args).join(' ');

        throw boom;
      });

      const command = lernaExec(testDir)('boom');

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          message: 'execution error',
          command: 'boom',
        })
      );
      expect(process.exitCode).toBe(123);

      // reset exit code
      process.exitCode = undefined;
    });

    it('should ignore execution errors with --no-bail', async () => {
      vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);
      (spawn as Mock).mockImplementationOnce((cmd, args, { pkg }) => {
        const boom: any = new Error(pkg.name);

        boom.failed = true;
        boom.exitCode = 456;
        boom.cmd = [cmd].concat(args).join(' ');

        // --no-bail passes { reject: false } to execa, so throwing is inappropriate
        return Promise.resolve(boom);
      });

      await lernaExec(testDir)('boom', '--no-bail', '--', '--shaka', '--lakka');

      // command doesn't throw, but it _does_ set exitCode
      expect(process.exitCode).toBe(456);

      // reset exit code
      process.exitCode = undefined;

      expect(spawn).toHaveBeenCalledTimes(2);
      expect(spawn).toHaveBeenLastCalledWith(
        'boom',
        ['--shaka', '--lakka'],
        expect.objectContaining({
          reject: false,
        })
      );
    });

    it('should filter packages with `ignore`', async () => {
      await lernaExec(testDir)('ls', '--ignore', 'package-1');

      expect(spawn).toHaveBeenCalledTimes(1);
      expect(spawn).toHaveBeenLastCalledWith('ls', [], {
        cwd: join(testDir, 'packages/package-2'),
        pkg: expect.objectContaining({
          name: 'package-2',
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: 'package-2',
          LERNA_ROOT_PATH: testDir,
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it('should run a command', async () => {
      await lernaExec(testDir)('ls');

      expect(spawn).toHaveBeenCalledTimes(2);
      expect(calledInPackages()).toEqual(['package-1', 'package-2']);
    });

    it('should run a command in dry-run mode and expect them all to be logged', async () => {
      await lernaExec(testDir)('ls', '--dry-run');

      const logLines = (logOutput as any).logged().split('\n');
      expect(logLines).toEqual(['[dry-run] > package-1', '[dry-run] > package-2']);
    });

    it('should run a command with parameters', async () => {
      await lernaExec(testDir)('ls', '--', '-la');

      expect(spawn).toHaveBeenCalledTimes(2);
      expect(spawn).toHaveBeenLastCalledWith('ls', ['-la'], expect.any(Object));
    });

    it('runs a command for a given scope', async () => {
      await lernaExec(testDir)('ls', '--scope', 'package-1');

      expect(calledInPackages()).toEqual(['package-1']);
    });

    it('does not run a command for ignored packages', async () => {
      await lernaExec(testDir)('ls', '--ignore', 'package-@(2|3|4)');

      expect(calledInPackages()).toEqual(['package-1']);
    });

    it('executes a command in all packages with --parallel', async () => {
      await lernaExec(testDir)('--parallel', 'ls');

      expect(execInPackagesStreaming(testDir)).toEqual(['packages/package-1 ls (prefix: package-1)', 'packages/package-2 ls (prefix: package-2)']);
    });

    it('omits package prefix with --parallel --no-prefix', async () => {
      await lernaExec(testDir)('--parallel', '--no-prefix', 'ls');

      expect(execInPackagesStreaming(testDir)).toEqual(['packages/package-1 ls (prefix: false)', 'packages/package-2 ls (prefix: false)']);
    });

    it('executes a command in all packages with --stream', async () => {
      await lernaExec(testDir)('--stream', 'ls');

      expect(execInPackagesStreaming(testDir)).toEqual(['packages/package-1 ls (prefix: package-1)', 'packages/package-2 ls (prefix: package-2)']);
    });

    it('executes a command in all packages with --stream in dry-run mode and expect them all to be logged', async () => {
      await lernaExec(testDir)('--stream', 'ls', '--dry-run');

      const logLines = (logOutput as any).logged().split('\n');

      expect(logLines).toEqual(['[dry-run] > package-1', '[dry-run] > package-2']);
    });

    it('omits package prefix with --stream --no-prefix', async () => {
      await lernaExec(testDir)('--stream', '--no-prefix', 'ls');

      expect(execInPackagesStreaming(testDir)).toEqual(['packages/package-1 ls (prefix: false)', 'packages/package-2 ls (prefix: false)']);
    });

    it('does not explode with filter flags', async () => {
      await lernaExec(testDir)('ls', '--no-private', '--since', '--include-merged-tags', '--exclude-dependents', '--include-dependencies');

      expect(calledInPackages()).toEqual(['package-1', 'package-2']);
    });
  });

  describe('with --profile', () => {
    it('executes a profiled command in all packages', async () => {
      const cwd = await initFixture('basic');

      await lernaExec(cwd)('--profile', '--', 'ls');

      const [profileLocation] = await globby('Lerna-Profile-*.json', { cwd, absolute: true });
      const json = await readJson(profileLocation);

      expect(json).toMatchObject([
        {
          name: 'package-1',
          ph: 'X',
          ts: expect.any(Number),
          pid: 1,
          tid: expect.any(Number),
          dur: expect.any(Number),
        },
        {
          name: 'package-2',
        },
      ]);
    });

    it('accepts --profile-location', async () => {
      const cwd = await initFixture('basic');

      await lernaExec(cwd)('--profile', '--profile-location', 'foo/bar', '--', 'ls');

      const [profileLocation] = await globby('foo/bar/Lerna-Profile-*.json', { cwd, absolute: true });
      const isExists = await pathExists(profileLocation);

      expect(isExists).toBe(true);
    });
  });

  describe('with --no-sort', () => {
    it('runs commands in lexical (not topological) order', async () => {
      const testDir = await initFixture('toposort');

      await lernaExec(testDir)('ls', '--no-sort');

      expect(calledInPackages()).toEqual([
        'package-cycle-1',
        'package-cycle-2',
        'package-cycle-extraneous-1',
        'package-cycle-extraneous-2',
        'package-dag-1',
        'package-dag-2a',
        'package-dag-2b',
        'package-dag-3',
        'package-standalone',
      ]);
    });
  });

  describe('in a cyclical repo', () => {
    it('warns when cycles are encountered', async () => {
      const testDir = await initFixture('toposort');

      await lernaExec(testDir)('ls', '--concurrency', '1');

      const [logMessage] = loggingOutput('warn');
      expect(logMessage).toMatch('Dependency cycles detected, you should fix these!');
      expect(logMessage).toMatch('package-cycle-1 -> package-cycle-2 -> package-cycle-1');

      expect(calledInPackages()).toEqual([
        'package-dag-1',
        'package-standalone',
        'package-dag-2a',
        'package-dag-2b',
        'package-cycle-1',
        'package-cycle-2',
        'package-dag-3',
        'package-cycle-extraneous-1',
        'package-cycle-extraneous-2',
      ]);
    });

    it('throws an error with --reject-cycles', async () => {
      const testDir = await initFixture('toposort');
      const command = lernaExec(testDir)('ls', '--reject-cycles');

      await expect(command).rejects.toThrow('Dependency cycles detected, you should fix these!');
    });
  });
});
