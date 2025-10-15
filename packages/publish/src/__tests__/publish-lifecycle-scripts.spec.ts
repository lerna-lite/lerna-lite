// mocked modules
// helpers
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runLifecycle } from '@lerna-lite/core';
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { loadJsonFile } from 'load-json-file';
import { afterEach, describe, expect, it, vi } from 'vitest';
// test command
import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands.js';
import { packDirectory } from '../lib/pack-directory.js';

vi.mock('load-json-file', async () => await vi.importActual('../../../version/src/lib/__mocks__/load-json-file'));

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual('../../../version/src/lib/__mocks__/git-push'));
vi.mock('../../../version/src/lib/is-anything-committed', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-anything-committed'));
vi.mock('../../../version/src/lib/is-behind-upstream', async () => await vi.importActual('../../../version/src/lib/__mocks__/is-behind-upstream'));
vi.mock('../../../version/src/lib/remote-branch-exists', async () => await vi.importActual('../../../version/src/lib/__mocks__/remote-branch-exists'));

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
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
}));

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

const lernaPublish = commandRunner(cliCommands);

describe('lifecycle scripts', () => {
  const npmLifecycleEvent = process.env.npm_lifecycle_event;

  afterEach(() => {
    process.env.npm_lifecycle_event = npmLifecycleEvent;
  });

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

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      // TODO: separate from VersionCommand details
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
    ]);

    expect(Array.from((loadJsonFile as any).registry.keys())).toStrictEqual(['/packages/package-1', '/packages/package-2', '/']);
  });

  it('does not execute recursive root scripts', async () => {
    const cwd = await initFixture('lifecycle');

    process.env.npm_lifecycle_event = 'prepublish';

    await lernaPublish(cwd)();

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      // TODO: separate from VersionCommand details
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
    ]);
  });

  it('does not duplicate rooted leaf scripts', async () => {
    const cwd = await initFixture('lifecycle-rooted-leaf');

    await lernaPublish(cwd)();

    expect((runLifecycle as any).getOrderedCalls()).toEqual([
      // TODO: separate from VersionCommand details
      ['package-1', 'preversion'],
      ['package-1', 'version'],
      ['lifecycle-rooted-leaf', 'preversion'],
      ['lifecycle-rooted-leaf', 'version'],
      ['lifecycle-rooted-leaf', 'postversion'],
      ['package-1', 'postversion'],
      // NO publish-specific root lifecycles should be duplicated
      // (they are all run by pack-directory and npm-publish)
    ]);
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
