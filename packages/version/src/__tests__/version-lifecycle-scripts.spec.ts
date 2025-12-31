import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runLifecycle, type VersionCommandOption } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import { loadJsonFile } from 'load-json-file';
import { afterEach, describe, expect, it, vi } from 'vitest';
import yargParser from 'yargs-parser';

// test command
import { VersionCommand } from '../version-command.js';

vi.mock('load-json-file', async () => vi.importActual('../lib/__mocks__/load-json-file'));

// local modules _must_ be explicitly mocked
vi.mock('../lib/git-push', async () => await vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/is-anything-committed', async () => await vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => await vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => await vi.importActual('../lib/__mocks__/remote-branch-exists'));

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  createRunner: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).createRunner,
  runLifecycle: (await vi.importActual<any>('../../../core/src/__mocks__/run-lifecycle')).runLifecycle,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFixture = initFixtureFactory(__dirname);

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
  });

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

    expect(Array.from((loadJsonFile as any).registry.keys())).toStrictEqual([
      '/packages/package-1',
      '/packages/package-2',
      '/', // `package-lock.json` project root location
    ]);
  });

  it('does not execute recursive root scripts', async () => {
    const cwd = await initFixture('lifecycle');

    process.env.npm_lifecycle_event = 'version';

    await new VersionCommand(createArgv(cwd));

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      ['package-1', 'preversion'],
      ['package-1', 'version'],
      ['package-1', 'postversion'],
    ]);
  });

  it('does not duplicate rooted leaf scripts', async () => {
    const cwd = await initFixture('lifecycle-rooted-leaf');

    await new VersionCommand(createArgv(cwd));

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      ['package-1', 'preversion'],
      ['package-1', 'version'],
      ['lifecycle-rooted-leaf', 'preversion'],
      ['lifecycle-rooted-leaf', 'version'],
      ['lifecycle-rooted-leaf', 'postversion'],
      ['package-1', 'postversion'],
    ]);
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
