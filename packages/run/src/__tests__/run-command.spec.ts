import { afterAll, afterEach, beforeAll, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('../lib/npm-run-script');
vi.mock('nx/src/tasks-runner/life-cycles/task-profiling-life-cycle');

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  runTopologically: (await vi.importActual<any>('../../../core/src/utils/run-topologically')).runTopologically,
  QueryGraph: (await vi.importActual<any>('../../../core/src/utils/query-graph')).QueryGraph,
}));

// also point to the local run command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/run', () => vi.importActual<any>('../run-command'));

import { pathExists, readJson } from 'fs-extra/esm';
import { globby } from 'globby';
import yargParser from 'yargs-parser';

// make sure to import the output mock
import { logOutput, RunCommandOption } from '@lerna-lite/core';

// mocked modules
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { npmRunScript, npmRunScriptStreaming } from '../lib/npm-run-script';
import cliRunCommands from '../../../cli/src/cli-commands/cli-run-commands';

// helpers
import { factory, RunCommand } from '../index';
import { commandRunner, initFixtureFactory, loggingOutput, normalizeRelativeDir } from '@lerna-test/helpers';
const lernaRun = commandRunner(cliRunCommands);
const initFixture = initFixtureFactory(__dirname);

// assertion helpers
const ranInPackagesCapturing = (testDir: string) =>
  (npmRunScriptStreaming as Mock).mock.calls.reduce((arr, [script, { args, npmClient, pkg, prefix }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, 'run', script, `(prefixed: ${prefix})`].concat(args);
    arr.push(record.join(' '));
    return arr;
  }, []);
const ranInPackagesStreaming = (testDir: string) =>
  (npmRunScriptStreaming as Mock).mock.calls.reduce((arr, [script, { args, npmClient, pkg, prefix }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, 'run', script, `(prefixed: ${prefix})`].concat(args);
    arr.push(record.join(' '));
    return arr;
  }, []);

const createArgv = (cwd: string, script?: string, ...args: any[]) => {
  args.unshift('run');
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  if (script) {
    argv.script = script;
  }
  args['logLevel'] = 'silent';
  return argv as unknown as RunCommandOption;
};

describe('RunCommand', () => {
  (npmRunScript as Mock).mockImplementation((script, { pkg }) => Promise.resolve({ exitCode: 0, stdout: pkg.name }));
  (npmRunScriptStreaming as Mock).mockImplementation(() => Promise.resolve({ exitCode: 0 }));

  afterEach(() => {
    process.exitCode = undefined;
  });

  describe('in a basic repo', () => {
    // working dir is never mutated
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture('basic');
      process.env.NX_DAEMON = 'false';
    });

    it('should complain if invoked with an empty script', async () => {
      const command = lernaRun(testDir)('');

      await expect(command).rejects.toThrow('You must specify a lifecycle script to run');
    });

    it('should complain if invoked with an empty script using factory', async () => {
      const command = factory(createArgv(testDir, ''));

      await expect(command).rejects.toThrow('You must specify a lifecycle script to run');
    });

    it('should complain if invoked with an empty script using RunCommand class', async () => {
      const command = new RunCommand(createArgv(testDir, ''));

      await expect(command).rejects.toThrow('You must specify a lifecycle script to run');
    });

    it('runs a script in packages', async () => {
      await lernaRun(testDir)('my-script');

      const logLines = (logOutput as any).logged().split('\n');
      expect(logLines).toContain('package-1');
      expect(logLines).toContain('package-3');
    });

    it('runs a script in packages with --stream', async () => {
      await lernaRun(testDir)('my-script', '--stream');

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it('runs a script in packages in capturing mode with --dry-run', async () => {
      await lernaRun(testDir)('my-script', '--dry-run');

      ranInPackagesCapturing(testDir);
      const logLines = (logOutput as any).logged().split('\n');
      expect(logLines).toEqual(['[dry-run] > package-1', '[dry-run] > package-3']);
    });

    it('runs package prefix with --stream and expect it to be prefixed', async () => {
      await new RunCommand(createArgv(testDir, 'my-script', '--stream'));

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it('omits package prefix with --stream --no-prefix', async () => {
      await new RunCommand(createArgv(testDir, 'my-script', '--stream', '--no-prefix'));

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it('run in --stream and --no-bail', async () => {
      await new RunCommand(createArgv(testDir, 'my-script', '--stream', '--no-bail'));

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it('always runs env script', async () => {
      await factory(createArgv(testDir, 'env'));
      // await lernaRun(testDir)('env');

      expect((logOutput as any).logged().split('\n')).toEqual(['package-1', 'package-4', 'package-2', 'package-3']);
    });

    it('runs a script only in scoped packages', async () => {
      // await lernaRun(testDir)('my-script', '--scope', 'package-1');
      await new RunCommand(createArgv(testDir, 'my-script', '--scope', 'package-1'));
      expect((logOutput as any).logged()).toBe('package-1');
    });

    it('does not run a script in ignored packages', async () => {
      await new RunCommand(createArgv(testDir, 'my-script', '--ignore', 'package-@(2|3|4)'));

      expect((logOutput as any).logged()).toBe('package-1');
    });

    it('does not error when no packages match', async () => {
      await new RunCommand(createArgv(testDir, 'missing-script'));

      expect(loggingOutput('info')).toContain('No packages found with the lifecycle script "missing-script"');
    });

    it('runs a script in all packages with --parallel', async () => {
      await new RunCommand(createArgv(testDir, 'env', '--parallel'));

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it('omits package prefix with --parallel --no-prefix', async () => {
      await new RunCommand(createArgv(testDir, 'env', '--parallel', '--no-prefix'));

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it('supports alternate npmClient configuration', async () => {
      await new RunCommand(createArgv(testDir, 'env', '--npm-client', 'yarn'));

      expect((logOutput as any).logged().split('\n')).toEqual(['package-1', 'package-4', 'package-2', 'package-3']);
    });

    it('reports script errors with early exit', async () => {
      vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);
      (npmRunScript as Mock).mockImplementationOnce((script, { pkg }) => {
        const err: any = new Error(pkg.name);

        err.failed = true;
        err.exitCode = 123;

        return Promise.reject(err);
      });

      const command = new RunCommand(createArgv(testDir, 'fail'));

      await expect(command).rejects.toThrow('package-1');
      expect(process.exitCode).toBe(123);

      // reset exit code
      process.exitCode = undefined;
    });

    it('propagates non-zero exit codes with --no-bail', async () => {
      vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);
      (npmRunScript as Mock).mockImplementationOnce((script, { pkg }) => {
        const err: any = new Error(pkg.name);

        err.failed = true;
        err.exitCode = 456;
        err.stdout = pkg.name;

        return Promise.resolve(err);
      });

      await new RunCommand(createArgv(testDir, 'my-script', '--no-bail'));

      expect(process.exitCode).toBe(456);
      expect((logOutput as any).logged().split('\n')).toEqual(['package-1', 'package-3']);

      // reset exit code
      process.exitCode = undefined;
    });
  });

  describe('with --profile', () => {
    it('executes a profiled command in all packages', async () => {
      const cwd = await initFixture('basic');

      await lernaRun(cwd)('my-script', '--profile');

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
          name: 'package-3',
        },
      ]);
    });

    it('accepts --profile-location', async () => {
      const cwd = await initFixture('basic');

      await new RunCommand(createArgv(cwd, 'my-script', '--profile', '--profile-location', 'foo/bar'));

      const [profileLocation] = await globby('foo/bar/Lerna-Profile-*.json', { cwd, absolute: true });
      const isExists = await pathExists(profileLocation, null as any);

      expect(isExists).toBe(true);
    });
  });

  describe('with --no-sort', () => {
    it('runs scripts in lexical (not topological) order', async () => {
      const testDir = await initFixture('toposort');

      await new RunCommand(createArgv(testDir, 'env', '--concurrency', '1', '--no-sort'));

      expect((logOutput as any).logged().split('\n')).toEqual([
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

    it('optionally streams output', async () => {
      const testDir = await initFixture('toposort');

      await new RunCommand(createArgv(testDir, 'env', '--concurrency', '1', '--no-sort', '--stream'));

      expect(ranInPackagesStreaming(testDir)).toMatchInlineSnapshot(`
        [
          packages/package-cycle-1 npm run env (prefixed: true),
          packages/package-cycle-2 npm run env (prefixed: true),
          packages/package-cycle-extraneous-1 npm run env (prefixed: true),
          packages/package-cycle-extraneous-2 npm run env (prefixed: true),
          packages/package-dag-1 npm run env (prefixed: true),
          packages/package-dag-2a npm run env (prefixed: true),
          packages/package-dag-2b npm run env (prefixed: true),
          packages/package-dag-3 npm run env (prefixed: true),
          packages/package-standalone npm run env (prefixed: true),
        ]
      `);
    });

    it('optionally streams output in --dry-run mode and expect them all to be logged', async () => {
      const testDir = await initFixture('toposort');

      await new RunCommand(createArgv(testDir, 'env', '--concurrency', '1', '--no-sort', '--stream', '--dry-run'));

      const logLines = (logOutput as any).logged().split('\n');
      expect(logLines).toEqual([
        '[dry-run] > package-cycle-1',
        '[dry-run] > package-cycle-2',
        '[dry-run] > package-cycle-extraneous-1',
        '[dry-run] > package-cycle-extraneous-2',
        '[dry-run] > package-dag-1',
        '[dry-run] > package-dag-2a',
        '[dry-run] > package-dag-2b',
        '[dry-run] > package-dag-3',
        '[dry-run] > package-standalone',
      ]);
    });
  });

  describe('in a cyclical repo', () => {
    it('warns when cycles are encountered', async () => {
      const testDir = await initFixture('toposort');

      await new RunCommand(createArgv(testDir, 'env', '--concurrency', '1'));

      const [logMessage] = loggingOutput('warn');
      expect(logMessage).toMatch('Dependency cycles detected, you should fix these!');
      expect(logMessage).toMatch('package-cycle-1 -> package-cycle-2 -> package-cycle-1');

      expect((logOutput as any).logged().split('\n')).toEqual([
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

    it('works with intersected cycles', async () => {
      const testDir = await initFixture('cycle-intersection');

      await new RunCommand(createArgv(testDir, 'env', '--concurrency', '1'));

      const [logMessage] = loggingOutput('warn');
      expect(logMessage).toMatch('Dependency cycles detected, you should fix these!');
      expect(logMessage).toMatch('b -> c -> d -> e -> b');
      expect(logMessage).toMatch('f -> g -> (nested cycle: b -> c -> d -> e -> b) -> f');

      expect((logOutput as any).logged().split('\n')).toEqual(['f', 'b', 'e', 'd', 'c', 'g', 'a']);
    });

    it('works with separate cycles', async () => {
      const testDir = await initFixture('cycle-separate');

      await new RunCommand(createArgv(testDir, 'env', '--concurrency', '1'));

      const [logMessage] = loggingOutput('warn');
      expect(logMessage).toMatch('Dependency cycles detected, you should fix these!');
      expect(logMessage).toMatch('b -> c -> d -> b');
      expect(logMessage).toMatch('e -> f -> g -> e');

      expect((logOutput as any).logged().split('\n')).toEqual(['e', 'g', 'f', 'h', 'b', 'd', 'c', 'a']);
    });

    it('should throw an error with --reject-cycles', async () => {
      const testDir = await initFixture('toposort');
      const command = new RunCommand(createArgv(testDir, 'env', '--reject-cycles'));

      await expect(command).rejects.toThrow('Dependency cycles detected, you should fix these!');
    });
  });

  // this is a temporary set of tests, which will be replaced by verdacio-driven tests
  // once the required setup is fully set up
  describe('in a repo powered by Nx', () => {
    let testDir;
    let collectedOutput = '';
    let originalStdout;

    beforeAll(async () => {
      testDir = await initFixture('powered-by-nx-with-target-defaults');
      process.env.NX_WORKSPACE_ROOT_PATH = testDir;
      // @ts-ignore
      vi.spyOn(process, 'exit').mockImplementation((code: any) => {
        if (code !== 0) {
          // do nothing
        }
      });
      originalStdout = process.stdout.write;
      (process.stdout as any).write = (v) => {
        collectedOutput = `${collectedOutput}\n${v}`;
      };
    });

    afterAll(() => {
      process.stdout.write = originalStdout;
    });

    it('runs a script in packages', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script');
      expect(collectedOutput).toContain('package-1');
      expect(collectedOutput).toContain('package-3');
      expect(collectedOutput).toContain('Successfully ran target');
    });

    it('runs a script in packages in CI mode', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script', '--ci');

      expect(process.env.CI).toBeTruthy();
      expect(collectedOutput).toContain('package-1');
      expect(collectedOutput).toContain('package-3');
      expect(collectedOutput).toContain('Successfully ran target');
    });

    it('runs a script with a colon in the script name', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('another-script:but-with-colons');
      expect(collectedOutput).toContain('package-1-script-with-colons');
      expect(collectedOutput).toContain('Successfully ran target');
    });

    it('runs a script only in scoped packages', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script', '--scope', 'package-1');
      expect(collectedOutput).toContain('package-1');
      expect(collectedOutput).not.toContain('package-3');
    });

    it('does not run a script in ignored packages', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script', '--ignore', 'package-@(2|3|4)');

      expect(collectedOutput).toContain('package-1');
      expect(collectedOutput).not.toContain('package-3');

      const logMessages = loggingOutput('info');
      expect(logMessages).toContain(
        'Using the "ignore" option when Nx targets are configured will exclude only tasks that are not determined to be required by Nx.'
      );
    });

    it('runs a script in packages with --stream', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script', '--stream');

      expect(collectedOutput).toContain('Lerna (powered by Nx)');
      // expect(collectedOutput).toContain('Running target my-script for 2 project(s)');
      expect(collectedOutput).toContain('package-1@1.0.0 my-script');
      expect(collectedOutput).toContain('package-3@1.0.0 my-script');
    });

    it('runs a script in packages with --stream and --no-prefix', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script', '--stream', '--no-prefix');

      expect(collectedOutput).toContain('Lerna (powered by Nx)');
      expect(collectedOutput).toContain('package-1@1.0.0 my-script');
      expect(collectedOutput).toContain('package-3@1.0.0 my-script');
    });

    it('runs a cacheable script', async () => {
      collectedOutput = '';
      await new RunCommand(createArgv(testDir, 'my-cacheable-script'));
      expect(collectedOutput).not.toContain('Nx read the output from the cache');

      collectedOutput = '';
      await new RunCommand(createArgv(testDir, 'my-cacheable-script'));
      expect(collectedOutput).toContain('Nx read the output from the cache');

      collectedOutput = '';
      await new RunCommand(createArgv(testDir, 'my-cacheable-script', '--skip-nx-cache'));
      expect(collectedOutput).not.toContain('Nx read the output from the cache');
    });

    it('should log a warning when using obsolete options with useNx', async () => {
      collectedOutput = '';

      await lernaRun(testDir)('my-script', '--sort');

      const [logMessage] = loggingOutput('warn');
      expect(logMessage).toContain('"parallel", "sort", and "no-sort" are ignored when Nx targets are configured.');
      expect(collectedOutput).toContain('package-1');
    });

    it('should log some infos when using "includeDependencies" options with useNx', async () => {
      collectedOutput = '';

      await lernaRun(testDir)('my-script', '--include-dependencies', '--', '--silent');

      const logMessages = loggingOutput('info');
      expect(logMessages).toContain(
        'Using the "include-dependencies" option when Nx targets are configured will include both task dependencies detected by Nx and project dependencies detected by Lerna.'
      );
      expect(collectedOutput).toContain('package-1');
    });

    it('logs a warning when using no-prefix and streaming output', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script', '--scope', 'package-1', '--no-prefix', '--no-stream');

      const logMessages = loggingOutput('warn');
      expect(logMessages).toContain('"no-prefix" is ignored when not using streaming output.');
      expect(collectedOutput).toContain('package-1');
    });

    it('generate an Nx profile and assigns the project relative path to NX_PROFILE environment variable', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script', '--scope', 'package-1', '--profile');

      expect(collectedOutput).toContain('package-1');
      expect(process.env.NX_PROFILE).toContain('Lerna-Profile');
    });
  });
});
