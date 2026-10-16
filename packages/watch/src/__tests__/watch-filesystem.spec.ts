import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { initFixtureFactory } from '@lerna-test/helpers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WatchCommand } from '../watch-command.js';

const initFixture = initFixtureFactory(import.meta.dirname);
const commands: WatchCommand[] = [];

async function startWatch(extraOptions = {}) {
  const root = await initFixture('basic');
  const command = new WatchCommand({
    cwd: root,
    command: 'echo',
    '--': ['echo'],
    debounce: 10,
    ...extraOptions,
  } as any);
  const runner = vi.spyOn(command as any, 'getRunner').mockResolvedValue({ exitCode: 0 });
  commands.push(command);
  await command;
  return { root, command, runner };
}

afterEach(async () => {
  for (const command of commands.splice(0)) {
    await (command as any).handleTermination();
  }
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe('Watch filesystem events', () => {
  it('detects new nested files and dotfiles without restarting', async () => {
    const { root, command, runner } = await startWatch();
    expect(runner).not.toHaveBeenCalled();
    const folder = join(root, 'packages/package-2/new-folder');
    await mkdir(folder);
    await writeFile(join(folder, 'new.ts'), 'export {};');
    await writeFile(join(folder, '.env'), 'KEY=value');
    await vi.waitFor(
      () => {
        const changes = runner.mock.calls.map(([, files]) => files).join(' ');
        expect(changes).toContain(join(folder, 'new.ts'));
        expect(changes).toContain(join(folder, '.env'));
      },
      { timeout: 5000 }
    );
    expect(command.watchedFiles.has('packages/package-2/new-folder/.env')).toBe(true);
  });

  it('reports both the old and new filename on rename, then forgets deleted files', async () => {
    const { root, command, runner } = await startWatch();
    const oldPath = join(root, 'packages/package-2/file-2.ts');
    const newPath = join(root, 'packages/package-2/renamed.ts');
    await rename(oldPath, newPath);
    await vi.waitFor(
      () => {
        const changes = runner.mock.calls.map(([, files]) => files).join(' ');
        expect(changes).toContain(oldPath);
        expect(changes).toContain(newPath);
      },
      { timeout: 5000 }
    );
    expect(command.watchedFiles.has('packages/package-2/file-2.ts')).toBe(false);
    runner.mockClear();
    await rm(newPath);
    await vi.waitFor(() => expect(runner).toHaveBeenCalled(), { timeout: 5000 });
    expect(command.watchedFiles.has('packages/package-2/renamed.ts')).toBe(false);
  });

  it('filters new files by glob while pruning ignored directories from the watcher', async () => {
    const { root, command, runner } = await startWatch({ glob: '**/*.ts' });
    await writeFile(join(root, 'packages/package-2/new.txt'), 'ignored by glob');
    await mkdir(join(root, 'packages/package-2/dist'));
    await writeFile(join(root, 'packages/package-2/dist/ignored.ts'), 'ignored output');
    await writeFile(join(root, 'packages/package-2/new.ts'), 'source');
    await vi.waitFor(() => expect(runner).toHaveBeenCalled(), { timeout: 5000 });
    const changes = runner.mock.calls.map(([, files]) => files).join(' ');
    expect(changes).toContain('new.ts');
    expect(changes).not.toContain('new.txt');
    expect(changes).not.toContain('ignored.ts');
    const watched = (command as any)._watcher.getWatched();
    expect(Object.keys(watched).some((dir) => dir.endsWith('dist'))).toBe(false);
  });
});
