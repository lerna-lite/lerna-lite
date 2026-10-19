import { chmodSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { log } from '@lerna-lite/npmlog';
import { initFixtureFactory, temporaryDirectory, updateLernaConfig } from '@lerna-test/helpers';
import { loggingOutput } from '@lerna-test/helpers/logging-output.js';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { getChildProcessCount } from '../child-process.js';
import { Command } from '../command.js';
import { outputFile, readJson, remove, writeJson } from '../utils/fs-utils.js';

const cpuCount = vi.hoisted(() => 42);

vi.mock('../child-process', async () => ({
  ...(await vi.importActual<any>('../child-process')),
  getChildProcessCount: vi.fn(() => 0),
}));
vi.mock('node:os', async () => ({
  ...(await vi.importActual<any>('node:os')),
  cpus: () => new Array(cpuCount),
}));

const initFixture = initFixtureFactory(import.meta.dirname);

describe('core-command', () => {
  let testDir = '';

  beforeAll(async () => {
    testDir = await initFixture('basic');
  });

  afterEach(() => {
    // ensure common CWD is restored when individual tests
    // initialize their own fixture (which changes CWD)
    if (process.cwd() !== testDir) {
      process.chdir(testDir);
    }
  });

  // swallow errors when passed in argv
  const onRejected = () => {};

  class OkCommand extends Command<any> {
    initialize() {
      return true;
    }

    execute() {
      return 'ok';
    }
  }

  // convenience to avoid silly 'not implemented errors'
  const testFactory = (argv = {}) => new OkCommand(Object.assign({ cwd: testDir } as any, argv));

  it('does not let a local Git shim shadow the Git binary during validation', async () => {
    const shim = join(testDir, 'node_modules', '.bin', process.platform === 'win32' ? 'git.cmd' : 'git');
    await outputFile(shim, process.platform === 'win32' ? '@echo off\r\nexit /b 42\r\n' : '#!/bin/sh\nexit 42\n');
    if (process.platform !== 'win32') {
      chmodSync(shim, 0o755);
    }
    try {
      expect(Command.prototype.gitInitialized.call({ options: {}, project: { rootPath: testDir } } as any)).toBe(true);
    } finally {
      await remove(shim);
    }
  });

  describe('.logger', () => {
    it('should be added to the instance', async () => {
      const command = testFactory();
      await command;

      expect(command.logger).toBeDefined();
    });
  });

  describe('.concurrency', () => {
    it('should be added to the instance', async () => {
      const command = testFactory({ concurrency: 6 });
      await command;

      expect(command.concurrency).toBe(6);
    });

    it('should fall back to default if concurrency given is NaN', async () => {
      const command = testFactory({ concurrency: 'foo' });
      await command;

      expect(command.concurrency).toBe(cpuCount);
    });

    it('should fall back to default if concurrency given is 0', async () => {
      const command = testFactory({ concurrency: 0 });
      await command;

      expect(command.concurrency).toBe(cpuCount);
    });

    it('should fall back to 1 if concurrency given is smaller than 1', async () => {
      const command = testFactory({ concurrency: -1 });
      await command;

      expect(command.concurrency).toBe(1);
    });
  });

  describe('.toposort', () => {
    it('is enabled by default', async () => {
      const command = testFactory();
      await command;

      expect(command.toposort).toBe(true);
    });

    it('is disabled when sort config is explicitly false (--no-sort)', async () => {
      const command = testFactory({ sort: false });
      await command;

      expect(command.toposort).toBe(false);
    });
  });

  describe('.execOpts', () => {
    const ONE_HUNDRED_MEGABYTES = 1000 * 1000 * 100;

    it('has maxBuffer', async () => {
      const command = testFactory({ maxBuffer: ONE_HUNDRED_MEGABYTES });
      await command;

      expect(command.execOpts.maxBuffer).toBe(ONE_HUNDRED_MEGABYTES);
    });

    it('has repo path', async () => {
      const command = testFactory();
      await command;

      expect(command.execOpts.cwd).toBe(testDir);
    });
  });

  it('returns a Promise', async () => {
    const result = await testFactory();

    expect(result).toBe('ok');
  });

  describe('when finished', () => {
    it('resolves immediately when no child processes active', async () => {
      await testFactory();

      const logMessages = loggingOutput('warn');
      expect(logMessages).toHaveLength(0);
    });

    it('waits to resolve when 1 child process active', async () => {
      (getChildProcessCount as Mock).mockReturnValueOnce(1);

      await testFactory();

      const [logMessage] = loggingOutput('warn');
      expect(logMessage).toMatch('Waiting for 1 child process to exit.');
    });

    it('waits to resolve when 2 child processes active', async () => {
      (getChildProcessCount as Mock).mockReturnValueOnce(2);

      await testFactory();

      const [logMessage] = loggingOutput('warn');
      expect(logMessage).toMatch('Waiting for 2 child processes to exit.');
    });
  });

  describe('with package error', () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
      console.error = vi.fn();
    });
    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('logs stdout and stderr of error from package', async () => {
      class PkgErrorCommand extends Command<any> {
        initialize() {
          return true;
        }

        execute() {
          const err: any = new Error('message');

          err.command = 'test-pkg-err';
          err.stdout = 'pkg-err-stdout';
          err.stderr = 'pkg-err-stderr';
          err.pkg = {
            name: 'pkg-err-name',
          };

          throw err;
        }
      }

      const command = new PkgErrorCommand({ cwd: testDir } as any);

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          command: 'test-pkg-err',
          stdout: 'pkg-err-stdout',
          stderr: 'pkg-err-stderr',
          pkg: expect.objectContaining({
            name: 'pkg-err-name',
          }),
        })
      );

      expect(console.error).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenNthCalledWith(1, 'pkg-err-stdout');
      expect(console.error).toHaveBeenNthCalledWith(2, 'pkg-err-stderr');
    });

    it('does not log stdout/stderr after streaming ends', async () => {
      class PkgErrorCommand extends Command<any> {
        initialize() {
          return true;
        }

        execute() {
          const err: any = new Error('message');

          err.command = 'test-pkg-err';
          err.stdout = 'pkg-err-stdout';
          err.stderr = 'pkg-err-stderr';
          err.pkg = {
            name: 'pkg-err-name',
          };

          throw err;
        }
      }

      const command = new PkgErrorCommand({ cwd: testDir, stream: true } as any);

      await expect(command).rejects.toThrow('message');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('does log when Prompt terminates', async () => {
      class ExitPromptError extends Error {
        override name = 'ExitPromptError';
      }

      class PkgErrorCommand extends Command<any> {
        initialize() {
          return true;
        }

        execute() {
          const err: any = new ExitPromptError('ExitPromptError');

          err.command = 'test-pkg-err';
          err.stdout = 'pkg-err-stdout';
          err.stderr = 'pkg-err-stderr';
          err.pkg = undefined;

          throw err;
        }
      }

      const command = new PkgErrorCommand({ cwd: testDir, stream: true } as any);

      await expect(command).resolves.toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('forbidden PUT response body', () => {
    function failCommand(overrides: Record<string, unknown> = {}) {
      const error = Object.assign(new Error('403 Forbidden'), {
        code: 'E403',
        statusCode: 403,
        method: 'PUT',
        uri: 'https://registry.example.test/package',
        body: Buffer.from('proxy denied the request'),
        ...overrides,
      });

      class ForbiddenPutCommand extends OkCommand {
        execute(): never {
          throw error;
        }
      }

      return { command: new ForbiddenPutCommand({ cwd: testDir } as any), error };
    }

    it('includes the response body in the saved debug log and preserves the original error', async () => {
      const { command, error } = failCommand();

      await expect(command).rejects.toBe(error);

      const debugLog = await readFile(join(testDir, 'lerna-debug.log'), 'utf8');
      expect(debugLog).toContain('response body for PUT https://registry.example.test/package:');
      expect(debugLog).toContain('proxy denied the request');
    });

    it('logs the body once for ValidationError without suppressing its message', async () => {
      const { command, error } = failCommand({ name: 'ValidationError' });

      await expect(command).rejects.toBe(error);

      const messages = loggingOutput('error');
      expect(messages.filter((message) => message.includes('response body for PUT'))).toEqual([
        'response body for PUT https://registry.example.test/package:\nproxy denied the request',
      ]);
      expect(messages).toContain('403 Forbidden');
    });

    it.each([
      ['a non-403 status', { statusCode: 500 }],
      ['a non-PUT method', { method: 'GET' }],
      ['a JSON body', { body: { error: 'registry error' } }],
      ['a string body', { body: 'proxy denied the request' }],
      ['a missing body', { body: undefined }],
    ])('does not add a response diagnostic for %s', async (_label, overrides) => {
      const { command, error } = failCommand(overrides);

      await expect(command).rejects.toBe(error);

      const debugLog = await readFile(join(testDir, 'lerna-debug.log'), 'utf8');
      expect(debugLog).not.toContain('response body for PUT');
    });

    it.each([4_000, 4_001])('limits a body of %i characters', async (length) => {
      const { command, error } = failCommand({ name: 'ValidationError', body: Buffer.from('x'.repeat(length)) });

      await expect(command).rejects.toBe(error);

      expect(loggingOutput('error')).toContain(
        `response body for PUT https://registry.example.test/package:\n${'x'.repeat(4_000)}${length > 4_000 ? '\n[response body truncated]' : ''}`
      );
    });

    it('decodes UTF-8 bodies and handles missing error metadata', async () => {
      const { command, error } = failCommand({
        name: 'ValidationError',
        code: undefined,
        uri: undefined,
        body: Buffer.from('Accès refusé'),
      });

      await expect(command).rejects.toBe(error);

      expect(loggingOutput('error')).toContain('response body for PUT (unknown URI):\nAccès refusé');
    });
  });

  describe('loglevel', () => {
    afterEach(() => {
      log.level = 'silent';
    });

    it('is set from lerna.json config', async () => {
      const cwd = await initFixture('basic');

      await updateLernaConfig(cwd, { loglevel: 'warn' });
      await testFactory({ cwd, onRejected });

      expect(log.level).toBe('warn');
    });
  });

  describe('.packageGraph', () => {
    it('returns the graph of packages', async () => {
      const command = testFactory();
      await command;

      expect(command.packageGraph).toBeInstanceOf(Map);
    });
  });

  describe('.options', () => {
    class TestACommand extends Command<any> {}
    class TestBCommand extends Command<any> {}
    class TestCCommand extends Command<any> {
      get otherCommandConfigs() {
        return ['testb'];
      }
    }

    it('does not mutate argv parameter', async () => {
      const argv = { cwd: testDir, onRejected };
      const instance = new TestACommand(argv as any);
      await instance;

      expect(argv).toEqual({ cwd: testDir, onRejected });
      expect(instance.argv).not.toEqual(argv);
    });

    it('should pick up global options', async () => {
      const instance = new TestACommand({ cwd: testDir, onRejected } as any);
      await instance;

      expect(instance.options.testOption).toBe('default');
    });

    it('should override global options with command-level options', async () => {
      const instance = new TestBCommand({ cwd: testDir, onRejected } as any);
      await instance;

      expect(instance.options.testOption).toBe('b');
    });

    it('should override global options with inherited command-level options', async () => {
      const instance = new TestCCommand({ cwd: testDir, onRejected } as any);
      await instance;

      expect(instance.options.testOption).toBe('b');
    });

    it('should override inherited command-level options with local command-level options', async () => {
      const instance = new TestCCommand({ cwd: testDir, onRejected } as any);
      await instance;

      expect(instance.options.testOption2).toBe('c');
    });

    it('should override everything with a CLI flag', async () => {
      const instance = new TestCCommand({
        cwd: testDir,
        onRejected,
        testOption2: 'f',
      } as any);
      await instance;

      expect(instance.options.testOption2).toBe('f');
    });

    it('should inherit durable options when a CLI flag is undefined', async () => {
      const instance = new TestCCommand({
        cwd: testDir,
        onRejected,
        testOption: undefined, // yargs does this when --test-option is not passed
      } as any);
      await instance;

      expect(instance.options.testOption).toBe('b');
    });
  });

  describe('subclass implementation', () => {
    ['initialize', 'execute'].forEach((method) => {
      it(`throws if ${method}() is not overridden`, () => {
        const command = new Command({ cwd: testDir, onRejected } as any);
        expect(() => (command as any)[method]()).toThrow(`${method}() needs to be implemented.`);
      });
    });
  });

  describe('validations', () => {
    it('throws ENOGIT when repository is not initialized', async () => {
      const cwd = temporaryDirectory();

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: 'ENOGIT',
        })
      );
    });

    it('throws ENOPKG when root package.json is not found', async () => {
      const cwd = await initFixture('basic');

      await remove(join(cwd, 'package.json'));

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: 'ENOPKG',
        })
      );
    });

    it('throws JSONError when root package.json has syntax error', async () => {
      const cwd = await initFixture('basic');

      await outputFile(
        join(cwd, 'package.json'), // trailing comma ...v
        `{ "name": "invalid", "lerna": { "version": "1.0.0" }, }`
      );

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: 'JSONError',
        })
      );
    });

    it('throws ENOLERNA when lerna.json is not found', async () => {
      const cwd = await initFixture('basic');

      await remove(join(cwd, 'lerna.json'));

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: 'ENOLERNA',
        })
      );
    });

    it('throws ENOVERSION when lerna.json is empty', async () => {
      const cwd = await initFixture('basic');

      const lernaConfigPath = join(cwd, 'lerna.json');
      await writeJson(lernaConfigPath, {});

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: 'ENOVERSION',
        })
      );
    });

    it('throws ENOVERSION when no version property exists in lerna.json', async () => {
      const cwd = await initFixture('basic');

      const lernaConfigPath = join(cwd, 'lerna.json');
      const lernaConfig = await readJson(lernaConfigPath);
      delete lernaConfig.version;
      await writeJson(lernaConfigPath, {
        ...lernaConfig,
      });

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: 'ENOVERSION',
        })
      );
    });
  });

  describe('loglevel with verbose option true', () => {
    it('should be set to verbose if loglevel is error', async () => {
      const command = testFactory({
        loglevel: 'error',
        verbose: true,
      });
      await command;

      expect(command.options.loglevel).toEqual('verbose');
    });

    it('should be set to verbose if loglevel is warn', async () => {
      const command = testFactory({
        loglevel: 'warn',
        verbose: true,
      });
      await command;

      expect(command.options.loglevel).toEqual('verbose');
    });

    it('should be set to verbose if loglevel is info', async () => {
      const command = testFactory({
        loglevel: 'info',
        verbose: true,
      });
      await command;

      expect(command.options.loglevel).toEqual('verbose');
    });

    it('should remain set to verbose if loglevel is verbose', async () => {
      const command = testFactory({
        loglevel: 'verbose',
        verbose: true,
      });
      await command;

      expect(command.options.loglevel).toEqual('verbose');
    });

    it('should not be set to verbose if loglevel is silly', async () => {
      const command = testFactory({
        loglevel: 'silly',
        verbose: true,
      });
      await command;

      expect(command.options.loglevel).toEqual('silly');
    });
  });

  describe('loglevel without verbose option', () => {
    it('should remain set to error if loglevel is error', async () => {
      const command = testFactory({
        loglevel: 'error',
      });
      await command;

      expect(command.options.loglevel).toEqual('error');
    });

    it('should remain set to warn if loglevel is warn', async () => {
      const command = testFactory({
        loglevel: 'warn',
      });
      await command;

      expect(command.options.loglevel).toEqual('warn');
    });

    it('should remain set to info if loglevel is info', async () => {
      const command = testFactory({
        loglevel: 'info',
      });
      await command;

      expect(command.options.loglevel).toEqual('info');
    });

    it('should remain set to verbose if loglevel is verbose', async () => {
      const command = testFactory({
        loglevel: 'verbose',
      });
      await command;

      expect(command.options.loglevel).toEqual('verbose');
    });

    it('should remain set to silly if loglevel is silly', async () => {
      const command = testFactory({
        loglevel: 'silly',
      });
      await command;

      expect(command.options.loglevel).toEqual('silly');
    });
  });
});

describe('gitInitialized catch block', () => {
  it('returns false when xSync from tinyexec throws', async () => {
    // 1. Locally mock tinyexec only for this test
    vi.doMock('tinyexec', () => ({
      xSync: vi.fn(() => {
        throw new Error('Git not found');
      }),
    }));

    // 2. Dynamically import the class AFTER the mock is defined
    class TestCommand extends Command<any> {
      options: { cwd: string; dryRun: boolean } = { cwd: process.cwd(), dryRun: false };
      initialize() {}
      execute() {}
    }

    // Pass a valid options object (at least { cwd })
    const instance = new TestCommand({ cwd: process.cwd(), dryRun: false });
    const result = instance.gitInitialized();

    expect(result).toBe(false);

    // 3. Clean up so other tests aren't affected
    vi.doUnmock('tinyexec');
  });
});
