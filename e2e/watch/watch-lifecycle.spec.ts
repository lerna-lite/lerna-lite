import { spawn, type ChildProcess } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { terminateChildProcess } from '../../packages/watch/src/terminate-child-process.js';

interface WatchResult {
  name: string;
  files: string;
  binary?: string;
  args?: string[];
  cwd?: string;
  phase?: string;
}

interface StartOptions {
  shell?: boolean;
  command?: string[];
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  debounce?: number;
}

const shellPath = (path: string) => `"${path.replace(/\\/g, '/')}"`;

describe('lerna watch lifecycle', () => {
  let root: string;
  let child: ChildProcess | undefined;
  let closed: Promise<number | null>;
  let output: string;

  beforeEach(async () => {
    // Spaces exercise both native argv handling and shell quoting.
    root = await mkdtemp(join(tmpdir(), 'lerna-watch lifecycle-'));
    output = '';
    await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'watch-lifecycle-fixture', private: true, workspaces: ['packages/*'] }));
    await writeFile(join(root, 'lerna.json'), JSON.stringify({ version: '1.0.0' }));
    for (const name of ['foo', 'foobar']) {
      await mkdir(join(root, 'packages', name), { recursive: true });
      await writeFile(join(root, 'packages', name, 'package.json'), JSON.stringify({ name, version: '1.0.0' }));
    }
    await writeFile(
      join(root, 'runner.cjs'),
      `
      const { appendFileSync } = require('node:fs');
      const files = process.env.LERNA_FILE_CHANGES;
      appendFileSync(process.env.WATCH_RESULTS, JSON.stringify({ name: process.env.LERNA_PACKAGE_NAME, files }) + '\\n');
      console.log('callback:' + process.env.LERNA_PACKAGE_NAME);
      if (files.includes('fail.ts')) process.exit(7);
    `
    );
  });

  afterEach(async () => {
    if (child?.pid && child.exitCode === null && child.signalCode === null) {
      await terminateChildProcess(child);
    }
    child = undefined;
    await rm(root, { recursive: true, force: true });
  });

  async function start(args: string[] = [], runner = 'runner.cjs', options: StartOptions = {}) {
    child = spawn(
      process.execPath,
      [
        resolve('packages/cli/dist/cli.js'),
        'watch',
        `--debounce=${options.debounce ?? 30}`,
        ...(options.shell ? [] : ['--no-shell']),
        ...args,
        '--',
        ...(options.command ?? [process.execPath, join(root, runner)]),
      ],
      {
        cwd: options.cwd ?? root,
        env: { ...process.env, ...options.env, WATCH_RESULTS: join(root, 'results.jsonl'), NO_COLOR: '1' },
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      }
    );
    child.stdout!.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr!.on('data', (chunk) => {
      output += chunk;
    });
    closed = new Promise((done, reject) => {
      child!.once('error', reject);
      child!.once('close', done);
    });
    await vi.waitFor(() => expect(output).toContain('Watching for changes...'), { timeout: 10000 });
  }

  async function results(): Promise<WatchResult[]> {
    try {
      return (await readFile(join(root, 'results.jsonl'), 'utf8'))
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch (error: any) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async function stop(expectedCode = 0) {
    child!.stdin!.end();
    expect(await closed).toBe(expectedCode);
  }

  async function createPackageManagerShims() {
    await writeFile(
      join(root, 'record-command.cjs'),
      `
      const { appendFileSync } = require('node:fs');
      appendFileSync(process.env.WATCH_RESULTS, JSON.stringify({
        name: process.env.LERNA_PACKAGE_NAME, files: process.env.LERNA_FILE_CHANGES,
        binary: process.argv[2], args: process.argv.slice(3), cwd: process.cwd()
      }) + '\\n');
      console.log('selected:' + process.argv[2]);
    `
    );
    const activeBin = join(root, 'active-bin');
    for (const [folder, label] of [
      [activeBin, 'active'],
      [join(root, 'node_modules/.bin'), 'shadow'],
    ] as const) {
      await mkdir(folder, { recursive: true });
      if (process.platform === 'win32') {
        await writeFile(join(folder, 'pnpm.cmd'), `@echo off\r\n"${process.execPath}" "${join(root, 'record-command.cjs')}" ${label} %*\r\n`);
      } else {
        const shim = join(folder, 'pnpm');
        await writeFile(shim, `#!/bin/sh\nexec '${process.execPath}' '${join(root, 'record-command.cjs')}' ${label} "$@"\n`);
        await chmod(shim, 0o755);
      }
    }
    const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
    return { [pathKey]: `${activeBin}${delimiter}${process.env[pathKey] ?? ''}` };
  }

  it.each([false, true])('preserves PR #1411 PATH resolution and argv in default shell mode (stream=%s)', async (stream) => {
    const env = await createPackageManagerShims();
    await start(stream ? ['--stream'] : [], 'runner.cjs', {
      shell: true,
      command: ['pnpm', 'run', '-r', '--filter', '"$LERNA_PACKAGE_NAME"', 'dev'],
      env,
    });
    await writeFile(join(root, 'packages/foobar/trigger.ts'), 'trigger');
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records).toHaveLength(1);
        expect(records[0].binary).toBe('active');
        expect(records[0].cwd).toBe(join(root, 'packages/foobar'));
        // cmd.exe uses %VAR%; cross-env-shell covers portable $VAR expansion below.
        expect(records[0].args).toEqual(['run', '-r', '--filter', process.platform === 'win32' ? '$LERNA_PACKAGE_NAME' : 'foobar', 'dev']);
      },
      { timeout: 10000 }
    );
    await stop();
    expect(output).not.toContain('DEP0190');
  });

  it.each([false, true])('preserves PR #1411 cross-env-shell expansion and PATH resolution (stream=%s)', async (stream) => {
    await writeFile(join(root, 'packages/foo/package.json'), JSON.stringify({ name: '@scope/foo', version: '1.0.0' }));
    const env = await createPackageManagerShims();
    const crossEnvShell = fileURLToPath(import.meta.resolve('cross-env/bin/cross-env-shell'));
    await start(stream ? ['--stream'] : [], 'runner.cjs', {
      shell: true,
      command: [shellPath(process.execPath), shellPath(crossEnvShell), "'pnpm run -r --filter $LERNA_PACKAGE_NAME dev'"],
      env,
    });
    await writeFile(join(root, 'packages/foobar/first.ts'), 'first');
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records).toHaveLength(1);
        expect(records[0].binary).toBe('active');
        expect(records[0].args).toEqual(['run', '-r', '--filter', 'foobar', 'dev']);
        expect(records[0].name).toBe('foobar');
        expect(records[0].files).toBe(join(root, 'packages/foobar/first.ts'));
      },
      { timeout: 10000 }
    );
    await writeFile(join(root, 'packages/foo/second.ts'), 'second');
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records).toHaveLength(2);
        expect(records[1].binary).toBe('active');
        expect(records[1].args).toEqual(['run', '-r', '--filter', '@scope/foo', 'dev']);
        expect(records[1].name).toBe('@scope/foo');
      },
      { timeout: 10000 }
    );
    await stop();
  });

  it('preserves literal arguments with --no-shell, including spaces and shell characters', async () => {
    await createPackageManagerShims();
    const args = ['one argument with spaces', '$LERNA_PACKAGE_NAME', 'a&b', 'double"quote'];
    await start([], 'runner.cjs', { command: [process.execPath, join(root, 'record-command.cjs'), 'native', ...args] });
    await writeFile(join(root, 'packages/foo/trigger.ts'), 'trigger');
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records).toHaveLength(1);
        expect(records[0].args).toEqual(args);
        expect(records[0].name).toBe('foo');
      },
      { timeout: 10000 }
    );
    await stop();
  });

  it.each([
    ['--scope=foobar', '--include-dependencies'],
    ['--scope=foo', '--include-dependents'],
  ])('applies package selection (%s %s), glob, ignores and delimiter to actual callbacks', async (...selection) => {
    await writeFile(join(root, 'packages/foobar/package.json'), JSON.stringify({ name: 'foobar', version: '1.0.0', dependencies: { foo: '1.0.0' } }));
    await mkdir(join(root, 'packages/baz'));
    await writeFile(join(root, 'packages/baz/package.json'), JSON.stringify({ name: '@scope/baz', version: '1.0.0' }));
    await start([...selection, '--glob=src/**/*.ts', '--ignored=**/generated/**', '--file-delimiter=;;'], 'runner.cjs', { debounce: 150 });
    for (const folder of ['packages/foo/src/generated', 'packages/foo/dist', 'packages/foobar/src', 'packages/baz/src']) {
      await mkdir(join(root, folder), { recursive: true });
    }
    await writeFile(join(root, 'packages/foo/src/generated/ignored.ts'), 'ignored');
    await writeFile(join(root, 'packages/foo/dist/ignored.ts'), 'ignored');
    await writeFile(join(root, 'packages/foobar/src/ignored.txt'), 'ignored');
    await writeFile(join(root, 'packages/baz/src/ignored.ts'), 'ignored');
    const files = ['packages/foo/src/one.ts', 'packages/foo/src/two.ts', 'packages/foobar/src/three.ts'];
    await Promise.all(files.map((file) => writeFile(join(root, file), 'source')));
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records.map(({ name }) => name).sort()).toEqual(['foo', 'foobar']);
        expect(records.flatMap(({ files }) => files.split(';;')).sort()).toEqual(files.map((file) => join(root, file)).sort());
      },
      { timeout: 10000 }
    );
    await delay(200);
    await stop();
    expect(await results()).toHaveLength(2);
  });

  it('queues changes during a running command without overlap or dropped files', async () => {
    await writeFile(
      join(root, 'queued-runner.cjs'),
      `
      const { appendFileSync, existsSync } = require('node:fs');
      const record = phase => appendFileSync(process.env.WATCH_RESULTS, JSON.stringify({
        phase, name: process.env.LERNA_PACKAGE_NAME, files: process.env.LERNA_FILE_CHANGES
      }) + '\\n');
      record('start');
      const timer = setInterval(() => {
        if (existsSync(process.env.WATCH_RESULTS + '.release')) {
          clearInterval(timer); record('end');
        }
      }, 20);
    `
    );
    await start(['--file-delimiter=;;'], 'queued-runner.cjs');
    await writeFile(join(root, 'packages/foo/first.ts'), 'first');
    await vi.waitFor(async () => expect(await results()).toHaveLength(1), { timeout: 10000 });
    const queued = ['packages/foo/second.ts', 'packages/foo/third.ts', 'packages/foobar/fourth.ts'];
    await Promise.all(queued.map((file) => writeFile(join(root, file), 'queued')));
    await delay(200);
    expect(await results()).toHaveLength(1);
    await writeFile(join(root, 'results.jsonl.release'), 'release');
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records.map(({ phase }) => phase)).toEqual(['start', 'end', 'start', 'end', 'start', 'end']);
        expect(
          records
            .filter(({ phase }) => phase === 'start')
            .flatMap(({ files }) => files.split(';;'))
            .sort()
        ).toEqual(['packages/foo/first.ts', ...queued].map((file) => join(root, file)).sort());
      },
      { timeout: 10000 }
    );
    await stop();
  });

  it('executes the initial inventory only when --no-ignore-initial is requested', async () => {
    await start(['--no-ignore-initial']);
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records.map(({ name }) => name).sort()).toEqual(['foo', 'foobar']);
        expect(records.map(({ files }) => files).sort()).toEqual(
          ['foo', 'foobar'].map((name) => join(root, 'packages', name, 'package.json')).sort()
        );
      },
      { timeout: 10000 }
    );
    await stop();
  });

  it('normalizes watcher events against the repository root when invoked from a package', async () => {
    await start([], 'runner.cjs', { cwd: join(root, 'packages/foo') });
    const changed = join(root, 'packages/foobar/changed.ts');
    await writeFile(changed, 'changed');
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records).toHaveLength(1);
        expect(records[0].name).toBe('foobar');
        expect(records[0].files).toBe(changed);
      },
      { timeout: 10000 }
    );
    await stop();
  });

  it('detects new nested files, dotfiles and renames, and streams more than one callback', async () => {
    await start(['--stream']);
    expect(await results()).toEqual([]);
    const folder = join(root, 'packages/foobar/src');
    await mkdir(folder);
    await writeFile(join(folder, 'new.ts'), 'source');
    await writeFile(join(folder, '.env'), 'KEY=value');
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records.every(({ name }) => name === 'foobar')).toBe(true);
        expect(records.map(({ files }) => files).join(' ')).toContain('.env');
        expect(records.map(({ files }) => files).join(' ')).toContain('new.ts');
      },
      { timeout: 10000 }
    );
    await rename(join(folder, 'new.ts'), join(folder, 'renamed.ts'));
    await vi.waitFor(
      async () => {
        const records = await results();
        expect(records.map(({ files }) => files).join(' ')).toContain('renamed.ts');
        expect(output.match(/callback:foobar/g)!.length).toBeGreaterThan(1);
      },
      { timeout: 10000 }
    );
    // EOF exercises Watch's normal cleanup on Windows as well as POSIX.
    child!.stdin!.end();
    expect(await closed).toBe(0);
  });

  it('exits with the child failure status when bail is enabled', async () => {
    await start();
    await writeFile(join(root, 'packages/foo/fail.ts'), 'fail');
    expect(await closed).toBe(7);
    expect(output).toContain('exit 7');
  });

  it('continues after failures with --no-bail and preserves the failure status on EOF', async () => {
    await start(['--no-bail']);
    await writeFile(join(root, 'packages/foo/fail.ts'), 'fail');
    await vi.waitFor(() => expect(output).toContain('exit 7'), { timeout: 10000 });
    await writeFile(join(root, 'packages/foobar/success.ts'), 'success');
    await vi.waitFor(async () => expect((await results()).map(({ name }) => name)).toEqual(['foo', 'foobar']), { timeout: 10000 });
    child!.stdin!.end();
    expect(await closed).toBe(7);
  });

  it.each([false, true])('stops an active command and its descendants on EOF (shell=%s)', async (shell) => {
    await writeFile(
      join(root, 'long-running.cjs'),
      `
      const { spawn } = require('node:child_process');
      const { writeFileSync } = require('node:fs');
      const nested = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
      writeFileSync(process.env.WATCH_RESULTS, JSON.stringify([process.pid, nested.pid]));
      setInterval(() => {}, 1000);
      process.on('SIGTERM', () => { nested.once('exit', () => process.exit(0)); nested.kill('SIGTERM'); });
    `
    );
    await start([], 'long-running.cjs', {
      shell,
      command: shell ? [shellPath(process.execPath), shellPath(join(root, 'long-running.cjs'))] : undefined,
    });
    await writeFile(join(root, 'packages/foo/start.ts'), 'start');
    let pids: number[] = [];
    await vi.waitFor(
      async () => {
        pids = JSON.parse(await readFile(join(root, 'results.jsonl'), 'utf8'));
        expect(pids).toHaveLength(2);
      },
      { timeout: 10000 }
    );
    try {
      child!.stdin!.end();
      expect(await closed).toBe(0);
      await vi.waitFor(() => {
        for (const pid of pids) {
          expect(() => process.kill(pid, 0)).toThrow(/ESRCH/);
        }
      });
    } finally {
      for (const pid of pids) {
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          /* Already exited. */
        }
      }
    }
  });

  it.skipIf(process.platform === 'win32')('returns conventional signal exit codes for SIGINT and SIGTERM', async () => {
    for (const [signal, code] of [
      ['SIGINT', 130],
      ['SIGTERM', 143],
    ] as const) {
      await start();
      child!.kill(signal);
      expect(await closed).toBe(code);
      output = '';
    }
  });

  it.skipIf(process.platform === 'win32')('forwards Ctrl+C to an active command and stops queued work', async () => {
    await writeFile(
      join(root, 'signal-runner.cjs'),
      `
      const { writeFileSync } = require('node:fs');
      writeFileSync(process.env.WATCH_RESULTS, String(process.pid));
      process.on('SIGINT', () => {
        writeFileSync(process.env.WATCH_RESULTS + '.stopped', 'SIGINT');
        process.exit(0);
      });
      setInterval(() => {}, 1000);
    `
    );
    await start([], 'signal-runner.cjs');
    await writeFile(join(root, 'packages/foo/start.ts'), 'start');
    await vi.waitFor(async () => expect(await readFile(join(root, 'results.jsonl'), 'utf8')).toMatch(/^\d+$/), { timeout: 10000 });
    await writeFile(join(root, 'packages/foobar/queued.ts'), 'queued');
    child!.kill('SIGINT');
    expect(await closed).toBe(130);
    expect(await readFile(join(root, 'results.jsonl.stopped'), 'utf8')).toBe('SIGINT');
  });
});
