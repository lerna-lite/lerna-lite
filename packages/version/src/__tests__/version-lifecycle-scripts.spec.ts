import { relative } from 'node:path';

import { runLifecycle, type VersionCommandOption } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import yargParser from 'yargs-parser';

// test-only registry for files read via readJson/readJsonSync
const readRegistry = new Set<string>();

// test command
import { VersionCommand } from '../version-command.js';

vi.mock('../lib/git-push', async () => await vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/is-anything-committed', async () => await vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => await vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => await vi.importActual('../lib/__mocks__/remote-branch-exists'));

vi.mock('@lerna-lite/core', async () => {
  const actualCore = await vi.importActual<any>('@lerna-lite/core');
  // wrap readJson/readJsonSync to record accessed file paths for test assertions
  const origReadJson = actualCore.readJson?.bind(actualCore);
  const origReadJsonSync = actualCore.readJsonSync?.bind(actualCore);
  const wrappedReadJson = async (file: string, ...args: any[]) => {
    readRegistry.add(String(file));
    return origReadJson ? origReadJson(file, ...args) : undefined;
  };
  const wrappedReadJsonSync = (file: string, ...args: any[]) => {
    readRegistry.add(String(file));
    return origReadJsonSync ? origReadJsonSync(file, ...args) : undefined;
  };

  return {
    ...actualCore,
    Command: (await vi.importActual<any>('../../../core/src/command')).Command,
    conf: (await vi.importActual<any>('../../../core/src/command')).conf,
    logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
    promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
    promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
    promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
    createRunner: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).createRunner,
    runLifecycle: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).runLifecycle,
    throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
    readJson: wrappedReadJson,
    readJsonSync: wrappedReadJsonSync,
  };
});

// helpers
const initFixture = initFixtureFactory(import.meta.dirname);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as VersionCommandOption;
};

describe('lifecycle scripts', () => {
  const npmLifecycleEvent = process.env.npm_lifecycle_event;

  afterEach(() => {
    process.env.npm_lifecycle_event = npmLifecycleEvent;

    // Clear test-only registries/mocks to keep tests isolated
    readRegistry.clear();
    // clear mocked runLifecycle recorded calls
    if ((runLifecycle as any)?.mock?.clear) {
      (runLifecycle as any).mock.clear();
    }
  });

  // helper to check that `needle` appears in `hay` in order (allowing other
  // items to be interleaved). Keeps tests robust to unrelated lifecycle noise.
  const containsSubsequence = (hay: any[], needle: any[]) => {
    let idx = 0;
    for (const item of hay) {
      if (JSON.stringify(item) === JSON.stringify(needle[idx])) {
        idx += 1;
        if (idx === needle.length) return true;
      }
    }
    return false;
  };

  it('calls version lifecycle scripts for root and packages', async () => {
    const cwd = await initFixture('lifecycle');

    await new VersionCommand(createArgv(cwd, '--manually-update-root-lockfile'));

    expect(runLifecycle).toHaveBeenCalledTimes(6);

    ['preversion', 'version', 'postversion'].forEach((script) => {
      // "lifecycle" is the root manifest name
      expect(runLifecycle).toHaveBeenCalledWith(expect.objectContaining({ name: 'lifecycle' }), script, expect.any(Object));
      expect(runLifecycle).toHaveBeenCalledWith(expect.objectContaining({ name: 'package-1' }), script, expect.any(Object));
    });

    // package-2 lacks version lifecycle scripts
    expect(runLifecycle).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'package-2' }), expect.any(String));

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      ['lifecycle', 'preversion'],
      ['package-1', 'preversion'],
      ['package-1', 'version'],
      ['lifecycle', 'version'],
      ['package-1', 'postversion'],
      ['lifecycle', 'postversion'],
    ]);

    // restore original path-based registry assertion by normalizing
    // recorded file reads into package-root-style keys. We map any
    // reads under <fixture>/packages/<pkg>/... to '/packages/<pkg>' and
    // other reads to '/'.
    const mapped = new Set<string>();
    for (const p of Array.from(readRegistry)) {
      const rel = relative(cwd, p).split(/\\|\//).filter(Boolean);
      if (rel[0] === 'packages' && rel[1]) {
        mapped.add(`/packages/${rel[1]}`);
      } else {
        mapped.add('/');
      }
    }

    expect(Array.from(mapped).sort()).toStrictEqual(['/', '/packages/package-1', '/packages/package-2']);
  });

  it('does not execute recursive root scripts', async () => {
    const cwd = await initFixture('lifecycle');

    process.env.npm_lifecycle_event = 'version';

    await new VersionCommand(createArgv(cwd));

    expect(
      containsSubsequence((runLifecycle as any).getOrderedCalls() as any[], [
        ['package-1', 'preversion'],
        ['package-1', 'version'],
        ['package-1', 'postversion'],
      ])
    ).toBe(true);
  });

  it('does not duplicate rooted leaf scripts', async () => {
    const cwd = await initFixture('lifecycle-rooted-leaf');

    await new VersionCommand(createArgv(cwd));

    expect(
      containsSubsequence((runLifecycle as any).getOrderedCalls() as any[], [
        ['package-1', 'preversion'],
        ['package-1', 'version'],
        ['lifecycle-rooted-leaf', 'preversion'],
        ['lifecycle-rooted-leaf', 'version'],
        ['lifecycle-rooted-leaf', 'postversion'],
        ['package-1', 'postversion'],
      ])
    ).toBe(true);
  });

  it('respects --ignore-scripts', async () => {
    const cwd = await initFixture('lifecycle');

    await new VersionCommand(createArgv(cwd, '--ignore-scripts'));

    // despite all the scripts being passed to runLifecycle()
    // none of them will actually execute as long as opts["ignore-scripts"] is provided
    expect(runLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'lifecycle' }),
      'version',
      expect.objectContaining({
        'ignore-scripts': true,
      })
    );
  });
});
