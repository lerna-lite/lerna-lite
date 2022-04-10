jest.mock('../lib/npm-run-script');

jest.mock('@lerna-lite/core', () => ({
  ...jest.requireActual('@lerna-lite/core') as any, // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
}));

// also point to the local run command so that all mocks are properly used even by the command-runner
jest.mock('@lerna-lite/run', () => jest.requireActual('../run-command'));

import fs from 'fs-extra';
import globby from 'globby';
import yargParser from 'yargs-parser';

// make sure to import the output mock
import { logOutput } from '@lerna-lite/core';

// mocked modules
const { npmRunScript, npmRunScriptStreaming } = require('../lib/npm-run-script');

// helpers
const initFixture = require('@lerna-test/init-fixture')(__dirname);
const { loggingOutput } = require('@lerna-test/logging-output');
const { normalizeRelativeDir } = require('@lerna-test/normalize-relative-dir');
import { factory, RunCommand } from '../run-command';
const lernaRun = require("@lerna-test/command-runner")(require("../../../cli/src/cli-commands/cli-run-commands"));

// assertion helpers
const ranInPackagesStreaming = (testDir: string) =>
  npmRunScriptStreaming.mock.calls.reduce((arr, [script, { args, npmClient, pkg, prefix }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, 'run', script, `(prefixed: ${prefix})`].concat(args);
    arr.push(record.join(' '));
    return arr;
  }, []);

const createArgv = (cwd: string, script?: string, ...args: string[]) => {
  args.unshift('run');
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  if (script) {
    argv.script = script;
  }
  args['logLevel'] = 'silent';
  return argv;
};

describe('RunCommand', () => {
  npmRunScript.mockImplementation((script, { pkg }) => Promise.resolve({ exitCode: 0, stdout: pkg.name }));
  npmRunScriptStreaming.mockImplementation(() => Promise.resolve({ exitCode: 0 }));

  afterEach(() => {
    process.exitCode = undefined;
  });

  describe('in a basic repo', () => {
    // working dir is never mutated
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture('basic');
    });

    it('should complain if invoked with an empty script', async () => {
      const command = lernaRun(testDir)('');

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
      // await new RunCommand(createArgv(testDir, 'my-script', '--stream'));

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it('omits package prefix with --stream --no-prefix', async () => {
      // await lernaRun(testDir)('my-script', '--stream', '--no-prefix');
      await new RunCommand(createArgv(testDir, 'my-script', '--stream', '--no-prefix'));

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

      expect(loggingOutput('info')).toContain(
        'No packages found with the lifecycle script "missing-script"'
      );
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
      npmRunScript.mockImplementationOnce((script, { pkg }) => {
        const err: any = new Error(pkg.name);

        err.failed = true;
        err.exitCode = 123;

        return Promise.reject(err);
      });

      const command = new RunCommand(createArgv(testDir, 'fail'));

      await expect(command).rejects.toThrow('package-1');
      expect(process.exitCode).toBe(123);
    });

    it('propagates non-zero exit codes with --no-bail', async () => {
      npmRunScript.mockImplementationOnce((script, { pkg }) => {
        const err: any = new Error(pkg.name);

        err.failed = true;
        err.exitCode = 456;
        err.stdout = pkg.name;

        return Promise.resolve(err);
      });

      await new RunCommand(createArgv(testDir, 'my-script', '--no-bail'));

      expect(process.exitCode).toBe(456);
      expect((logOutput as any).logged().split('\n')).toEqual(['package-1', 'package-3']);
    });
  });

  describe('with --include-filtered-dependencies', () => {
    it('runs scoped command including filtered deps', async () => {
      const testDir = await initFixture('include-filtered-dependencies');
      await lernaRun(testDir)(
        'my-script',
        '--scope',
        '@test/package-2',
        '--include-filtered-dependencies',
        '--',
        '--silent'
      );

      const logLines = (logOutput as any).logged().split('\n');
      expect(logLines).toContain('@test/package-1');
      expect(logLines).toContain('@test/package-2');
    });
  });

  describe('with --profile', () => {
    it('executes a profiled command in all packages', async () => {
      const cwd = await initFixture('basic');

      await new RunCommand(createArgv(cwd, 'my-script', '--profile'));

      const [profileLocation] = await globby('Lerna-Profile-*.json', { cwd, absolute: true });
      const json = await fs.readJson(profileLocation);

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
      const exists = await fs.exists(profileLocation, null);

      expect(exists).toBe(true);
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
        Array [
          "packages/package-cycle-1 npm run env (prefixed: true)",
          "packages/package-cycle-2 npm run env (prefixed: true)",
          "packages/package-cycle-extraneous-1 npm run env (prefixed: true)",
          "packages/package-cycle-extraneous-2 npm run env (prefixed: true)",
          "packages/package-dag-1 npm run env (prefixed: true)",
          "packages/package-dag-2a npm run env (prefixed: true)",
          "packages/package-dag-2b npm run env (prefixed: true)",
          "packages/package-dag-3 npm run env (prefixed: true)",
          "packages/package-standalone npm run env (prefixed: true)",
        ]
      `);
    });

    it('optionally streams output in run-dry-run mode and expect them all to be logged', async () => {
      const testDir = await initFixture('toposort');

      await new RunCommand(createArgv(testDir, 'env', '--concurrency', '1', '--no-sort', '--stream', '--run-dry-run'));

      const logLines = (logOutput as any).logged().split('\n');
      expect(logLines).toEqual([
        'dry-run> package-cycle-1',
        'dry-run> package-cycle-2',
        'dry-run> package-cycle-extraneous-1',
        'dry-run> package-cycle-extraneous-2',
        'dry-run> package-dag-1',
        'dry-run> package-dag-2a',
        'dry-run> package-dag-2b',
        'dry-run> package-dag-3',
        'dry-run> package-standalone',
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
});
