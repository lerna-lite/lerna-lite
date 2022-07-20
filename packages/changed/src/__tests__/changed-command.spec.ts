jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../core/src/__mocks__/prompt').promptTextInput,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
  collectUpdates: jest.requireActual('../../../core/src/__mocks__/collect-updates').collectUpdates,
  PackageGraph: jest.requireActual('../../../core/src/package-graph').PackageGraph,
  getPackages: jest.requireActual('../../../core/src/project').getPackages,
}));

// mocked modules
const { collectUpdates, logOutput } = require('@lerna-lite/core');

// helpers
import helpers from '@lerna-test/helpers';
const initFixture = helpers.initFixtureFactory(__dirname);
const { loggingOutput } = require('@lerna-test/helpers/logging-output');
import { updateLernaConfig } from '@lerna-test/helpers';

// file under test
import { ChangedCommand } from '../index';
import { factory } from '../changed-command';
import cliChangedCommands from '../../../cli/src/cli-commands/cli-changed-commands';
const lernaChanged = helpers.commandRunner(cliChangedCommands);

// file under test
const yargParser = require('yargs-parser');

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('changed');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: [{ key: 'ignoreChanges' }] });
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv;
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
expect.addSnapshotSerializer(require('@lerna-test/helpers/serializers/serialize-tempdir'));

describe('Changed Command', () => {
  let cwd;

  beforeAll(async () => {
    cwd = await initFixture('normal');
  });

  it('lists changed packages', async () => {
    collectUpdates.setUpdated(cwd, 'package-2', 'package-3');

    await factory(createArgv(cwd, ''));

    expect(logOutput.logged()).toMatchInlineSnapshot(`
package-2
package-3
`);
  });

  it('passes --force-publish to update collector', async () => {
    await new ChangedCommand(createArgv(cwd, '--force-publish'));

    expect(logOutput.logged()).toMatchInlineSnapshot(`
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
    await lernaChanged(cwd)('--ignore-changes', '**/cli-ignore');

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

    await lernaChanged(cwd)();

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ ignoreChanges: ['**/durable-ignore'] })
    );
  });

  it('passes --include-merged-tags to update collector', async () => {
    await lernaChanged(cwd)('--include-merged-tags');

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
    await lernaChanged(cwd)('--conventional-graduate', 'foo', '--force-publish', 'bar');

    const [logMessage] = loggingOutput('warn');
    expect(logMessage).toBe('--force-publish superseded by --conventional-graduate');
  });

  it('logger warns when --force-publish superseded by --conventional-graduate', async () => {
    const cmd = new ChangedCommand(createArgv(cwd, '--conventional-graduate', 'foo', '--force-publish', 'bar'));
    await cmd;
    const loggerSpy = jest.spyOn(cmd.logger, 'warn');
    cmd.initialize();

    expect(loggerSpy).toHaveBeenCalledWith('option', '--force-publish superseded by --conventional-graduate');
  });

  it('lists changed private packages with --all', async () => {
    collectUpdates.setUpdated(cwd, 'package-5');

    await lernaChanged(cwd)('--all');

    expect(logOutput.logged()).toBe('package-5 (PRIVATE)');
  });

  it('exits non-zero when there are no changed packages', async () => {
    collectUpdates.setUpdated(cwd);

    await new ChangedCommand(createArgv(cwd, ''));

    expect(process.exitCode).toBe(1);

    // reset exit code
    process.exitCode = undefined;
  });

  it('supports all listable flags', async () => {
    await lernaChanged(cwd)('-alp');

    expect(logOutput.logged()).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
__TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
__TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
__TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
__TEST_ROOTDIR__/packages/package-5:package-5:1.0.0:PRIVATE
`);
  });

  it('outputs a stringified array of result objects with --json', async () => {
    collectUpdates.setUpdated(cwd, 'package-2', 'package-3');

    await lernaChanged(cwd)('--json');

    // Output should be a parseable string
    const jsonOutput = JSON.parse(logOutput.logged());
    expect(jsonOutput).toMatchInlineSnapshot(`
Array [
  Object {
    "location": "__TEST_ROOTDIR__/packages/package-2",
    "name": "package-2",
    "private": false,
    "version": "1.0.0",
  },
  Object {
    "location": "__TEST_ROOTDIR__/packages/package-3",
    "name": "package-3",
    "private": false,
    "version": "1.0.0",
  },
]
`);
  });
});
