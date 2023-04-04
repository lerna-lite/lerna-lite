vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  PackageGraph: (await vi.importActual<any>('../../../core/src/package-graph')).PackageGraph,
  getPackages: (await vi.importActual<any>('../../../core/src/project')).getPackages,
}));

// also point to the local version command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/changed', async () => await vi.importActual('../changed-command'));

// mocked modules
import { ChangedCommandOption, collectUpdates, logOutput } from '@lerna-lite/core';
import cliChangedCommands from '../../../cli/src/cli-commands/cli-changed-commands.js';

// helpers
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import { updateLernaConfig } from '@lerna-test/helpers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

// file under test
import yargParser from 'yargs-parser';
import { ChangedCommand } from '../index';
import { factory } from '../changed-command';
const lernaChanged = commandRunner(cliChangedCommands);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('changed');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: [{ key: 'ignoreChanges' }] });
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv as unknown as ChangedCommandOption;
};

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

// normalize temp directory paths in snapshots
import serializeTempdir from '@lerna-test/helpers/serializers/serialize-tempdir';
expect.addSnapshotSerializer(serializeTempdir);

describe('Changed Command', () => {
  let cwd;

  beforeAll(async () => {
    vi.resetModules();
    cwd = await initFixture('normal');
  });

  it('lists changed packages', async () => {
    (collectUpdates as any).setUpdated(cwd, 'package-2', 'package-3');

    await factory(createArgv(cwd, ''));

    expect((logOutput as any).logged()).toMatchInlineSnapshot(`
      package-2
      package-3
    `);
  });

  it('passes --force-publish to update collector', async () => {
    await new ChangedCommand(createArgv(cwd, '--force-publish'));

    expect((logOutput as any).logged()).toMatchInlineSnapshot(`
      package-1
      package-2
      package-3
      package-4
    `);
    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ forcePublish: true })
    );
  });

  it('passes --ignore-changes to update collector', async () => {
    await new ChangedCommand(createArgv(cwd, '--ignore-changes', '**/cli-ignore'));

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ ignoreChanges: ['**/cli-ignore'] })
    );
  });

  it('reads durable ignoreChanges config from version namespace', async () => {
    await updateLernaConfig(cwd, {
      command: {
        version: {
          ignoreChanges: ['**/durable-ignore'],
        },
      },
    });

    await new ChangedCommand(createArgv(cwd, ''));

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ ignoreChanges: ['**/durable-ignore'] })
    );
  });

  it('passes --include-merged-tags to update collector', async () => {
    await new ChangedCommand(createArgv(cwd, '--include-merged-tags'));

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ includeMergedTags: true })
    );
  });

  it('passes --conventional-graduate to update collector', async () => {
    await new ChangedCommand(createArgv(cwd, '--conventional-graduate=*'));
    // await lernaChanged(cwd)('--conventional-graduate=*');

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ conventionalGraduate: '*', conventionalCommits: true })
    );
  });

  it('warns when --force-publish superseded by --conventional-graduate', async () => {
    await new ChangedCommand(createArgv(cwd, '--conventional-graduate', 'foo', '--force-publish', 'bar'));

    const [logMessage] = loggingOutput('warn');
    expect(logMessage).toBe('--force-publish superseded by --conventional-graduate');
  });

  it('logger warns when --force-publish superseded by --conventional-graduate', async () => {
    const cmd = new ChangedCommand(createArgv(cwd, '--conventional-graduate', 'foo', '--force-publish', 'bar'));
    await cmd;
    const loggerSpy = vi.spyOn(cmd.logger, 'warn');
    cmd.initialize();

    expect(loggerSpy).toHaveBeenCalledWith('option', '--force-publish superseded by --conventional-graduate');
  });

  it('lists changed private packages with --all', async () => {
    (collectUpdates as any).setUpdated(cwd, 'package-5');

    await new ChangedCommand(createArgv(cwd, '--all'));

    expect((logOutput as any).logged()).toBe('package-5 (PRIVATE)');
  });

  it('exits non-zero when there are no changed packages', async () => {
    vi.spyOn(process, 'exit').mockImplementationOnce((() => {}) as any);
    (collectUpdates as any).setUpdated(cwd);

    await new ChangedCommand(createArgv(cwd, ''));

    expect(process.exitCode).toBe(1);

    // reset exit code
    process.exitCode = undefined;
  });

  it('supports all listable flags', async () => {
    // await new ChangedCommand(createArgv(cwd, '-alp'));
    await lernaChanged(cwd)('-alp');

    expect((logOutput as any).logged()).toMatchInlineSnapshot(`
      __TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
      __TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
      __TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
      __TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
      __TEST_ROOTDIR__/packages/package-5:package-5:1.0.0:PRIVATE
    `);
  });

  it('outputs a stringified array of result objects with --json', async () => {
    (collectUpdates as any).setUpdated(cwd, 'package-2', 'package-3');

    await new ChangedCommand(createArgv(cwd, '--json'));

    // Output should be a parseable string
    const jsonOutput = JSON.parse((logOutput as any).logged());
    expect(jsonOutput).toMatchInlineSnapshot(`
      [
        {
          "location": "__TEST_ROOTDIR__/packages/package-2",
          "name": "package-2",
          "private": false,
          "version": "1.0.0",
        },
        {
          "location": "__TEST_ROOTDIR__/packages/package-3",
          "name": "package-3",
          "private": false,
          "version": "1.0.0",
        },
      ]
    `);
  });
});
