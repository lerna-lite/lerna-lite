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
import { WatchCommandOption, collectUpdates, logOutput } from '@lerna-lite/core';

// helpers
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(__dirname);
import { loggingOutput } from '@lerna-test/helpers/logging-output';
import { updateLernaConfig } from '@lerna-test/helpers';

// file under test
import yargParser from 'yargs-parser';
import { WatchCommand } from '../index';
import { factory } from '../watch-command';
import cliWatchCommands from '../../../cli/src/cli-commands/cli-watch-commands';
const lernaWatch = commandRunner(cliWatchCommands);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('watch');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: [{ key: 'ignoreChanges' }] });
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv as unknown as WatchCommandOption;
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

describe('Watch Command', () => {
  let cwd;

  beforeAll(async () => {
    cwd = await initFixture('normal');
  });

  it('should instantiate the service', () => {
    const cmd = new WatchCommand(createArgv(cwd, ''));
    expect(cmd).toBeDefined();
  });
});
