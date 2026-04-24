import { logOutput, type RunCommandOption } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import yargParser from 'yargs-parser';

import { RunCommand } from '../index.js';
import { npmRunScript, npmRunScriptStreaming } from '../lib/npm-run-script.js';

let procCount = 0;
const fakeProcs: any[] = [];

vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => {
    const listeners: Record<string, Function[]> = { close: [], stdoutData: [], stderrData: [] };
    const procId = ++procCount;
    let stdoutEmitted = false;
    let stderrEmitted = false;
    let closeEmitted = false;
    const proc = {
      stdout: {
        on: (event: string, cb: Function) => {
          (listeners[`stdoutData`] = listeners[`stdoutData`] || []).push(cb);
          if (event === 'data' && !stdoutEmitted) {
            stdoutEmitted = true;
            setTimeout(() => {
              cb(`output from proc ${procId}\n`);
            }, 0);
          }
        },
        emit: (event: string, ...args: any[]) => {
          if (event === 'data') {
            (listeners[`stdoutData`] || []).forEach((fn) => fn(...args));
          }
        },
      },
      stderr: {
        on: (event: string, cb: Function) => {
          (listeners[`stderrData`] = listeners[`stderrData`] || []).push(cb);
          if (event === 'data' && !stderrEmitted) {
            stderrEmitted = true;
            setTimeout(() => {
              cb(`error from proc ${procId}\n`);
            }, 0);
          }
        },
        emit: (event: string, ...args: any[]) => {
          if (event === 'data') {
            (listeners[`stderrData`] || []).forEach((fn) => fn(...args));
          }
        },
      },
      on: (event: string, cb: Function) => {
        (listeners[event] = listeners[event] || []).push(cb);
        if (event === 'close' && !closeEmitted) {
          closeEmitted = true;
          setTimeout(() => {
            cb();
          }, 0);
        }
      },
      emit: (event: string, ...args: any[]) => {
        if (event === 'close') {
          (listeners['close'] || []).forEach((fn) => fn(...args));
        }
      },
      exitCode: 0,
    };
    fakeProcs.push({ proc, procId });
    return proc;
  }),
}));
vi.mock('../lib/npm-run-script');

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

const initFixture = initFixtureFactory(import.meta.dirname);

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

const createArgv = (cwd: string, script?: string, ...args: any[]) => {
  args.unshift('run');
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  if (script) {
    argv.script = script;
  }
  (args as any)['logLevel'] = 'silent';
  return argv as unknown as RunCommandOption;
};

describe('RunCommand', () => {
  (npmRunScript as Mock).mockImplementation((script, { pkg }) => Promise.resolve({ exitCode: 0, stdout: pkg.name }));
  (npmRunScriptStreaming as Mock).mockImplementation(() => Promise.resolve({ exitCode: 0 }));

  afterEach(() => {
    process.exitCode = undefined;
  });
  beforeEach(() => {
    procCount = 0;
    fakeProcs.length = 0;
  });

  describe('RunCommand --aggregate-output', () => {
    afterEach(() => {
      // vi.restoreAllMocks();
      (logOutput as any).clear?.();
    });
    beforeEach(() => {
      procCount = 0;
      fakeProcs.length = 0;
    });

    it('buffers and prints output after each parallel process finishes', async () => {
      const testDir = await initFixture('basic');
      // Await the async constructor
      const command = new RunCommand(createArgv(testDir, 'my-script', '--parallel', '--aggregate-output'));
      await command;

      // Simulate output and process close after a tick
      setTimeout(() => {
        fakeProcs.forEach(({ proc, procId }) => {
          proc.stdout.emit('data', `output from proc ${procId}\n`);
          proc.stderr.emit('data', `error from proc ${procId}\n`);
          proc.emit('close');
        });
      }, 0);

      await command.initialize();
      await command.execute();

      // Wait a tick to ensure setTimeout runs and events are processed
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: output contains all buffered output, in aggregate
      const output = (logOutput as any).logged();
      expect(output).toMatch(/output from proc 1/);
      expect(output).toMatch(/output from proc 2/);
      expect(output).toMatch(/error from proc 1/);
      expect(output).toMatch(/error from proc 2/);
      // Optionally: check for aggregate formatting, order, etc.
    });
  });
});
