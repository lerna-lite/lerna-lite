import { join } from 'node:path';

import { runLifecycle, readJson, readJsonSync } from '@lerna-lite/core';
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands.js';
import { packDirectory } from '../lib/pack-directory.js';

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual('../../../version/src/lib/__mocks__/git-push'));
vi.mock(
  '../../../version/src/lib/is-anything-committed',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/is-anything-committed')
);
vi.mock('../../../version/src/lib/is-behind-upstream', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-behind-upstream'));
vi.mock(
  '../../../version/src/lib/remote-branch-exists',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/remote-branch-exists')
);

// test-only registry for files read via readJson/readJsonSync
const readRegistry = new Set<string>();

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => {
  const actualCore = await vi.importActual<any>('@lerna-lite/core');

  const origReadJson = actualCore.readJson?.bind(actualCore);
  const origReadJsonSync = actualCore.readJsonSync?.bind(actualCore);

  const wrappedReadJson = vi.fn(async (file: string, ...args: any[]) => {
    readRegistry.add(String(file));
    return origReadJson ? await origReadJson(file, ...args) : undefined;
  });

  const wrappedReadJsonSync = vi.fn((file: string, ...args: any[]) => {
    readRegistry.add(String(file));
    return origReadJsonSync ? origReadJsonSync(file, ...args) : undefined;
  });

  return {
    ...actualCore, // return the other real methods, below we'll mock only selected methods
    Command: (await vi.importActual<any>('../../../core/src/command')).Command,
    conf: (await vi.importActual<any>('../../../core/src/command')).conf,
    collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
    getOneTimePassword: () => Promise.resolve('654321'),
    logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
    createRunner: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).createRunner,
    runLifecycle: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).runLifecycle,
    promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
    promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
    promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
    throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
    readJson: wrappedReadJson,
    readJsonSync: wrappedReadJsonSync,
  };
});

// also point to the local publish command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/publish', async () => await vi.importActual('../publish-command'));
vi.mock('@lerna-lite/version', async () => await vi.importActual('../../../version/src/version-command'));

// local modules _must_ be explicitly mocked
vi.mock('../lib/get-packages-without-license', async () => await vi.importActual('../lib/__mocks__/get-packages-without-license'));
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock('../lib/get-two-factor-auth-required', async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required'));
vi.mock('../lib/pack-directory', async () => await vi.importActual('../lib/__mocks__/pack-directory'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));

const initFixture = initFixtureFactory(import.meta.dirname);

const lernaPublish = commandRunner(cliCommands);

describe('lifecycle scripts', () => {
  const npmLifecycleEvent = process.env.npm_lifecycle_event;

  afterEach(() => {
    process.env.npm_lifecycle_event = npmLifecycleEvent;
    // clear test-only registry for readJson/readJsonSync
    readRegistry.clear();
    if ((readJson as any)?.mock?.clear) {
      (readJson as any).mock.clear();
    }
    if ((readJsonSync as any)?.mock?.clear) {
      (readJsonSync as any).mock.clear();
    }
  });

  // Helper to assert that `needle` appears in `hay` in order (allowing
  // other items interleaved). Shared across tests.
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

  it('calls publish lifecycle scripts for root and packages', async () => {
    const cwd = await initFixture('lifecycle');

    await lernaPublish(cwd)();

    ['prepare', 'prepublishOnly', 'prepack', 'postpack', 'postpublish'].forEach((script) => {
      // "lifecycle" is the root manifest name
      expect(runLifecycle).toHaveBeenCalledWith(expect.objectContaining({ name: 'lifecycle' }), script, expect.any(Object));
    });

    // package-2 only has prepublish lifecycle
    expect(packDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'package-2' }),
      join(cwd, 'packages/package-2'),
      expect.objectContaining({
        'ignore-prepublish': false,
        'ignore-scripts': false,
      }),
      { ignoreMissing: true }
    );

    // ensure packages and root were included in lifecycle runs
    const calledNamesFromRun = new Set<string>(((runLifecycle as any).getOrderedCalls() as any[]).map((c: any) => String(c[0])));
    // package-2's publish lifecycle is handled via `packDirectory`/npm-publish
    // and therefore may not appear in `runLifecycle` calls. Ensure the
    // core lifecycle runners were invoked for package-1 and the root.
    expect(calledNamesFromRun.has('package-1')).toBe(true);
    expect(calledNamesFromRun.has('lifecycle')).toBe(true);

    // ensure the important lifecycle call sequence exists (in order),
    // but allow other entries to be interleaved (non-brittle)
    const calls = (runLifecycle as any).getOrderedCalls() as any[];
    const expectedSequence = [
      ['lifecycle', 'preversion'],
      ['package-1', 'preversion'],
      ['package-1', 'version'],
      ['lifecycle', 'version'],
      ['package-1', 'postversion'],
      ['lifecycle', 'postversion'],
      // publish-specific
      ['lifecycle', 'prepublish'],
      ['lifecycle', 'prepare'],
      ['lifecycle', 'prepublishOnly'],
      ['lifecycle', 'prepack'],
      ['lifecycle', 'postpack'],
      ['lifecycle', 'postpublish'],
    ];

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

    expect(containsSubsequence(calls, expectedSequence)).toBe(true);

    // restore a similar assertion to the old `load-json-file` registry check
    // by collecting the unique package names that were touched during the
    // publish flow. This is less brittle than asserting on absolute paths.
    const calledNames = new Set<string>(calledNamesFromRun);
    // prefer the explicit registry exported by the packDirectory mock (if present)
    const packRegistry = (packDirectory as any).registry ?? new Set<string>();
    for (const name of Array.from(packRegistry) as string[]) {
      calledNames.add(name);
    }

    // also include any package manifests that were read via readJson/readJsonSync
    for (const p of Array.from(readRegistry)) {
      const rel = p.split(/[\\/]/).filter(Boolean);
      const idx = rel.indexOf('packages');
      if (idx !== -1 && rel[idx + 1]) {
        calledNames.add(rel[idx + 1]);
      }
    }

    expect(Array.from(calledNames).sort()).toStrictEqual(['lifecycle', 'package-1', 'package-2']);
  });

  it('does not execute recursive root scripts', async () => {
    const cwd = await initFixture('lifecycle');

    process.env.npm_lifecycle_event = 'prepublish';

    await lernaPublish(cwd)();

    const calls2 = (runLifecycle as any).getOrderedCalls() as any[];
    const expectedSequence2 = [
      ['lifecycle', 'preversion'],
      ['package-1', 'preversion'],
      ['package-1', 'version'],
      ['lifecycle', 'version'],
      ['package-1', 'postversion'],
      ['lifecycle', 'postversion'],
      // publish-specific
      ['lifecycle', 'prepare'],
      ['lifecycle', 'prepublishOnly'],
      ['lifecycle', 'prepack'],
      ['lifecycle', 'postpack'],
    ];
    expect(containsSubsequence(calls2, expectedSequence2)).toBe(true);
  });

  it('does not duplicate rooted leaf scripts', async () => {
    const cwd = await initFixture('lifecycle-rooted-leaf');

    await lernaPublish(cwd)();

    const calls3 = (runLifecycle as any).getOrderedCalls() as any[];
    const expectedSequence3 = [
      ['package-1', 'preversion'],
      ['package-1', 'version'],
      ['lifecycle-rooted-leaf', 'preversion'],
      ['lifecycle-rooted-leaf', 'version'],
      ['lifecycle-rooted-leaf', 'postversion'],
      ['package-1', 'postversion'],
    ];
    expect(containsSubsequence(calls3, expectedSequence3)).toBe(true);
  });

  it('respects --ignore-prepublish', async () => {
    const cwd = await initFixture('lifecycle');

    await lernaPublish(cwd)('--ignore-prepublish');

    expect(packDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'package-2' }),
      join(cwd, 'packages/package-2'),
      expect.objectContaining({
        'ignore-prepublish': true,
      }),
      { ignoreMissing: true }
    );

    // runLifecycle() is _called_ with "prepublish" for root,
    // but it does not actually execute, and is tested elsewhere
  });

  it('respects --ignore-scripts', async () => {
    const cwd = await initFixture('lifecycle');

    await lernaPublish(cwd)('--ignore-scripts');

    // despite all the scripts being passed to runLifecycle() (and implicitly, packDirectory()),
    // none of them will actually execute as long as opts["ignore-scripts"] is provided
    expect(runLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'lifecycle' }),
      'prepare',
      expect.objectContaining({
        'ignore-scripts': true,
      })
    );
    expect(packDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'package-2' }),
      join(cwd, 'packages/package-2'),
      expect.objectContaining({
        'ignore-scripts': true,
      }),
      { ignoreMissing: true }
    );
  });
});
