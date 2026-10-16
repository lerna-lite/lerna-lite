import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const SHUTDOWN_TIMEOUT = 5000;

/** Stop the process tree owned by Watch, allowing POSIX commands time to clean up. */
export async function terminateChildProcess(child?: ChildProcess, signal: NodeJS.Signals = 'SIGTERM') {
  const pid = child?.pid;
  if (!pid) {
    return;
  }

  if (process.platform === 'win32') {
    // Windows does not have POSIX process groups; killing just cmd.exe leaves
    // package-manager and script descendants running. taskkill targets the tree.
    if (child.exitCode !== null || child.signalCode !== null) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const killer = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
        timeout: SHUTDOWN_TIMEOUT,
      });
      killer.once('error', reject);
      killer.once('close', (code) => {
        if (code === 0 || child.exitCode !== null || child.signalCode !== null) {
          resolve();
        } else {
          reject(new Error(`Unable to terminate process tree ${pid} (taskkill exited ${code})`));
        }
      });
    });
    return;
  }

  const signalGroup = (value: NodeJS.Signals | 0) => {
    try {
      process.kill(-pid, value);
      return true;
    } catch (error: any) {
      if (error.code === 'ESRCH') {
        return false;
      }
      throw error;
    }
  };

  if (!signalGroup(signal)) {
    return;
  }
  const deadline = Date.now() + SHUTDOWN_TIMEOUT;
  while (signalGroup(0)) {
    if (Date.now() >= deadline) {
      signalGroup('SIGKILL');
      break;
    }
    await delay(50);
  }
}
