import { logOutput, type RunCommandOption } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import yargParser from 'yargs-parser';

import { RunCommand } from '../index.js';
import { npmRunScript, npmRunScriptStreaming } from '../lib/npm-run-script.js';

let procCount = 0;
const fakeProcs: any[] = [];

// Isolated mock for this file only
vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => {
    const listeners: Record<string, Function[]> = { close: [], stdoutData: [], stderrData: [] };
    const procId = ++procCount;
    let stdoutEmitted = false;
    let stderrEmitted = false;
    let closeEmitted = false;
    // First proc will always fail
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
            // Set exitCode before close event for first proc
            if (procId === 1) proc.exitCode = 1;
            cb();
          }, 0);
        }
      },
      emit: (event: string, ...args: any[]) => {
        if (event === 'close') {
          // Set exitCode before close event for first proc
          if (procId === 1) proc.exitCode = 1;
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
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  runTopologically: (await vi.importActual<any>('../../../core/src/utils/run-topologically')).runTopologically,
  QueryGraph: (await vi.importActual<any>('../../../core/src/utils/query-graph')).QueryGraph,
}));

vi.mock('@lerna-lite/run', () => vi.importActual<any>('../run-command'));

const initFixture = initFixtureFactory(import.meta.dirname);

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

describe('RunCommand --aggregate-output=failures-only (isolated)', () => {
  (npmRunScript as Mock).mockImplementation((script, { pkg }) => Promise.resolve({ exitCode: 0, stdout: pkg.name }));
  (npmRunScriptStreaming as Mock).mockImplementation(() => Promise.resolve({ exitCode: 0 }));

  afterEach(() => {
    process.exitCode = undefined;
    (logOutput as any).clear?.();
    procCount = 0;
    fakeProcs.length = 0;
  });
  beforeEach(() => {
    procCount = 0;
    fakeProcs.length = 0;
  });

  it('only prints output for failed packages with --aggregate-output=failures-only', async () => {
    const testDir = await initFixture('basic');
    const command = new RunCommand(createArgv(testDir, 'my-script', '--parallel', '--aggregate-output=failures-only'));
    await command;

    setTimeout(() => {
      fakeProcs.forEach(({ proc, procId }) => {
        proc.stdout.emit('data', `output from proc ${procId}\n`);
        proc.stderr.emit('data', `error from proc ${procId}\n`);
      });
      // Set exitCode synchronously before emitting 'close'
      fakeProcs.forEach(({ proc }, idx) => {
        proc.exitCode = idx === 0 ? 1 : 0;
        proc.emit('close');
      });
    }, 0);

    await command.initialize();
    await command.execute();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const output = (logOutput as any).logged();
    const failedProc = fakeProcs[0].procId;
    expect(output).toMatch(new RegExp(`output from proc ${failedProc}`));
    expect(output).toMatch(new RegExp(`error from proc ${failedProc}`));
    for (let i = 1; i < fakeProcs.length; i++) {
      expect(output).not.toMatch(new RegExp(`output from proc ${fakeProcs[i].procId}`));
    }
  });
});
