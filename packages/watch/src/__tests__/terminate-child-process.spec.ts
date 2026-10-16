import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { terminateChildProcess } from '../terminate-child-process.js';

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }));

vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal()),
  spawn: spawnMock,
}));

beforeEach(async () => {
  spawnMock.mockImplementation((await vi.importActual<any>('node:child_process')).spawn);
});

function isRunning(pid: number) {
  try {
    process.kill(pid, 0);
    // Linux may retain an already killed orphan as a zombie until init reaps it.
    if (process.platform === 'linux' && /\) Z /.test(readFileSync(`/proc/${pid}/stat`, 'utf8'))) {
      return false;
    }
    return true;
  } catch (error: any) {
    if (error.code === 'ESRCH' || error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function startTree(ignoreSignal = false) {
  const code = `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    console.log(child.pid);
    setInterval(() => {}, 1000);
    process.on('SIGTERM', () => {
      ${ignoreSignal ? '' : "child.once('exit', () => process.exit(0)); child.kill('SIGTERM');"}
    });
  `;
  const parent = spawn(process.execPath, ['-e', code], {
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let output = '';
  parent.stdout!.on('data', (chunk) => {
    output += chunk;
  });
  await vi.waitFor(() => expect(output).toMatch(/^\d+\r?\n/));
  return { parent, grandchildPid: Number(output.trim()) };
}

async function cleanup(parent: ChildProcess, grandchildPid: number) {
  try {
    await terminateChildProcess(parent);
  } finally {
    if (isRunning(grandchildPid)) {
      process.kill(grandchildPid, 'SIGKILL');
    }
    if (parent.pid && isRunning(parent.pid)) {
      parent.kill('SIGKILL');
    }
  }
}

describe('Watch child process termination', () => {
  it('terminates the owned child and its descendants', async () => {
    const { parent, grandchildPid } = await startTree();
    try {
      await terminateChildProcess(parent);
      await vi.waitFor(() => {
        expect(isRunning(parent.pid!)).toBe(false);
        expect(isRunning(grandchildPid)).toBe(false);
      });
    } finally {
      await cleanup(parent, grandchildPid);
    }
  });

  it('uses taskkill to stop a Windows process tree', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const killer = new EventEmitter();
    spawnMock.mockReturnValueOnce(killer);
    try {
      const stopping = terminateChildProcess({ pid: 12345, exitCode: null, signalCode: null } as ChildProcess);
      killer.emit('close', 0);
      await expect(stopping).resolves.toBeUndefined();
      expect(spawnMock).toHaveBeenCalledWith('taskkill', ['/pid', '12345', '/T', '/F'], expect.objectContaining({ windowsHide: true }));
    } finally {
      Object.defineProperty(process, 'platform', platform);
    }
  });

  it('reports a taskkill failure for a still-running Windows process', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    spawnMock.mockReturnValueOnce(new EventEmitter());
    try {
      const stopping = terminateChildProcess({ pid: 12345, exitCode: null, signalCode: null } as ChildProcess);
      spawnMock.mock.results[0].value.emit('close', 1);
      await expect(stopping).rejects.toThrow('taskkill exited 1');
    } finally {
      Object.defineProperty(process, 'platform', platform);
    }
  });

  it.skipIf(process.platform === 'win32')('escalates when a command ignores SIGTERM', async () => {
    const { parent, grandchildPid } = await startTree(true);
    try {
      await terminateChildProcess(parent);
      await vi.waitFor(() => expect(isRunning(parent.pid!)).toBe(false));
      expect(isRunning(grandchildPid)).toBe(false);
    } finally {
      await cleanup(parent, grandchildPid);
    }
  });

  it('handles missing or already exited children', async () => {
    await expect(terminateChildProcess()).resolves.toBeUndefined();
    const child = spawn(process.execPath, ['-e', 'process.exit(0)'], { detached: process.platform !== 'win32', windowsHide: true });
    await new Promise((resolve) => child.once('close', resolve));
    await expect(terminateChildProcess(child)).resolves.toBeUndefined();
  });

  it('signals the POSIX process group and escalates after the grace period', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const kill = vi.spyOn(process, 'kill').mockReturnValue(true);
    const now = vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(6000);
    try {
      await terminateChildProcess({ pid: 12345 } as ChildProcess, 'SIGINT');
      expect(kill.mock.calls).toEqual([
        [-12345, 'SIGINT'],
        [-12345, 0],
        [-12345, 'SIGKILL'],
      ]);
    } finally {
      Object.defineProperty(process, 'platform', platform);
      kill.mockRestore();
      now.mockRestore();
    }
  });

  it('waits for a POSIX process group that is shutting down', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    let livenessChecks = 0;
    const kill = vi.spyOn(process, 'kill').mockImplementation((_pid, signal) => {
      if (signal === 0 && ++livenessChecks === 2) {
        throw Object.assign(new Error('group exited'), { code: 'ESRCH' });
      }
      return true;
    });
    try {
      await terminateChildProcess({ pid: 12345 } as ChildProcess);
      expect(kill.mock.calls).toEqual([
        [-12345, 'SIGTERM'],
        [-12345, 0],
        [-12345, 0],
      ]);
    } finally {
      Object.defineProperty(process, 'platform', platform);
      kill.mockRestore();
    }
  });

  it('ignores missing POSIX groups while propagating other termination errors', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const kill = vi.spyOn(process, 'kill');
    try {
      kill.mockImplementationOnce(() => {
        throw Object.assign(new Error('gone'), { code: 'ESRCH' });
      });
      await expect(terminateChildProcess({ pid: 12345 } as ChildProcess)).resolves.toBeUndefined();
      kill.mockImplementationOnce(() => {
        throw Object.assign(new Error('denied'), { code: 'EPERM' });
      });
      await expect(terminateChildProcess({ pid: 12345 } as ChildProcess)).rejects.toThrow('denied');
    } finally {
      Object.defineProperty(process, 'platform', platform);
      kill.mockRestore();
    }
  });
});
