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

// file under test
import { ListCommand } from '../index';
import { factory } from '../list-command';
import cliListCommands from '../../../cli/src/cli-commands/cli-list-commands';
const lernaList = helpers.commandRunner(cliListCommands);

// file under test
const yargParser = require('yargs-parser');

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('list');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
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
    return depth ? `'${val}'` : val;
  },
});

// normalize temp directory paths in snapshots
expect.addSnapshotSerializer(require('@lerna-test/helpers/serializers/serialize-windows-paths'));
expect.addSnapshotSerializer(require('@lerna-test/helpers/serializers/serialize-tempdir'));

describe('List Command', () => {
  describe('in a basic repo', () => {
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture('basic');
    });

    it('should list public packages', async () => {
      await new ListCommand(createArgv(testDir, ''));
      expect(logOutput.logged()).toMatchInlineSnapshot(`
package-1
package-2
package-3
package-4
`);
    });

    it('should also list private packages with --all', async () => {
      await lernaList(testDir)('--all');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
package-1
package-2
package-3
package-4
package-5 (PRIVATE)
`);
    });

    it('lists public package versions and relative paths with --long', async () => {
      await factory(createArgv(testDir, '--long'));
      // await lernaList(testDir)('--long');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
package-1 v1.0.0 packages/package-1
package-2 v1.0.0 packages/package-2
package-3 v1.0.0 packages/package-3
package-4 v1.0.0 packages/package-4
`);
    });

    it('lists all package versions and relative paths with --long --all', async () => {
      await lernaList(testDir)('-la');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
package-1 v1.0.0 packages/package-1
package-2 v1.0.0 packages/package-2
package-3 v1.0.0 packages/package-3
package-4 v1.0.0 packages/package-4
package-5 v1.0.0 packages/package-5 (PRIVATE)
`);
    });

    it('lists public package locations with --parseable', async () => {
      await lernaList(testDir)('--parseable');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/package-1
__TEST_ROOTDIR__/packages/package-2
__TEST_ROOTDIR__/packages/package-3
__TEST_ROOTDIR__/packages/package-4
`);
    });

    it('lists all package locations with --parseable --all', async () => {
      await lernaList(testDir)('-pa');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/package-1
__TEST_ROOTDIR__/packages/package-2
__TEST_ROOTDIR__/packages/package-3
__TEST_ROOTDIR__/packages/package-4
__TEST_ROOTDIR__/packages/package-5
`);
    });

    it('lists public package locations with --parseable --long', async () => {
      await lernaList(testDir)('--parseable', '--long');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
__TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
__TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
__TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
`);
    });

    it('lists all package locations with --parseable --long --all', async () => {
      await lernaList(testDir)('-pal');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
__TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
__TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
__TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
__TEST_ROOTDIR__/packages/package-5:package-5:1.0.0:PRIVATE
`);
    });

    it('lists packages matching --scope', async () => {
      await lernaList(testDir)('--scope', 'package-1');
      expect(logOutput.logged()).toMatchInlineSnapshot(`package-1`);
    });

    it('does not list packages matching --ignore', async () => {
      await lernaList(testDir)('--ignore', 'package-@(2|3|4|5)');
      expect(logOutput.logged()).toMatchInlineSnapshot(`package-1`);
    });

    it('does not list private packages with --no-private', async () => {
      await lernaList(testDir)('--no-private');
      expect(logOutput.logged()).not.toMatch('package-5 v1.0.0 (private)');
    });

    it('does not emit empty stdout', async () => {
      collectUpdates.setUpdated(testDir);
      await lernaList(testDir)('--since', 'deadbeef');
      expect(logOutput).not.toHaveBeenCalled();
      expect(collectUpdates).toHaveBeenLastCalledWith(
        expect.any(Array),
        expect.any(Map),
        expect.any(Object),
        expect.objectContaining({ since: 'deadbeef' })
      );
    });
  });

  describe('in a repo with packages outside of packages/', () => {
    it('should list packages', async () => {
      const testDir = await initFixture('extra');
      await lernaList(testDir)();
      expect(logOutput.logged()).toMatchInlineSnapshot(`
package-3
package-1
package-2
`);
    });
  });

  describe('--include-filtered-dependencies', () => {
    it('should list packages, including filtered ones', async () => {
      const testDir = await initFixture('include-filtered-dependencies');
      await lernaList(testDir)('--scope', '@test/package-2', '--include-filtered-dependencies');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
@test/package-2
@test/package-1
`);
    });
  });

  describe('--include-filtered-dependents', () => {
    it('should list packages, including filtered ones', async () => {
      const testDir = await initFixture('include-filtered-dependencies');
      await lernaList(testDir)('--scope', '@test/package-1', '--include-filtered-dependents');
      expect(logOutput.logged()).toMatchInlineSnapshot(`
@test/package-1
@test/package-2
`);
    });
  });

  describe('with an undefined version', () => {
    it('replaces version with MISSING', async () => {
      const testDir = await initFixture('undefined-version');
      await lernaList(testDir)('--long');
      expect(logOutput.logged()).toMatchInlineSnapshot(`package-1 MISSING packages/package-1`);
    });

    it('appends MISSING flag to long parseable output', async () => {
      const testDir = await initFixture('undefined-version');
      await lernaList(testDir)('--long', '--parseable');
      expect(logOutput.logged()).toMatchInlineSnapshot(`__TEST_ROOTDIR__/packages/package-1:package-1:MISSING`);
    });
  });

  describe('--json', () => {
    it('should list packages as json objects', async () => {
      const testDir = await initFixture('basic');
      await lernaList(testDir)('--json', '-a');

      // Output should be a parseable string
      const jsonOutput = JSON.parse(logOutput.logged());
      expect(jsonOutput).toEqual([
        {
          location: expect.stringContaining('package-1'),
          name: 'package-1',
          private: false,
          version: '1.0.0',
        },
        {
          location: expect.stringContaining('package-2'),
          name: 'package-2',
          private: false,
          version: '1.0.0',
        },
        {
          location: expect.stringContaining('package-3'),
          name: 'package-3',
          private: false,
          version: '1.0.0',
        },
        {
          location: expect.stringContaining('package-4'),
          name: 'package-4',
          private: false,
          version: '1.0.0',
        },
        {
          location: expect.stringContaining('package-5'),
          name: 'package-5',
          private: true,
          version: '1.0.0',
        },
      ]);
    });

    it('emits empty array with no results', async () => {
      const testDir = await initFixture('basic');

      collectUpdates.setUpdated(testDir);
      await lernaList(testDir)('--since', 'deadbeef', '--json');

      expect(JSON.parse(logOutput.logged())).toEqual([]);
    });
  });

  describe('in a Yarn workspace', () => {
    it('should use package.json/workspaces setting', async () => {
      const testDir = await initFixture('yarn-workspaces');
      await lernaList(testDir)();
      expect(logOutput.logged()).toMatchInlineSnapshot(`
package-1
package-2
`);
    });
  });

  describe('with terribly complicated dependency cycles', () => {
    // for reference: 1->2, 1->3, 1->4, 2->4, 2->5, 3->4, 3->6, 4->1, 4->4,  5->4, 6->4, 7->4
    // We design the package tree in a very specific way. We want to test several different things
    // * A package depending on itself isn't added twice (package 4)
    // * A package being added twice in the same stage of the expansion isn't added twice (package 4)
    // * A package that has already been processed wont get added twice (package 1)
    it('should list all packages with no repeats', async () => {
      const testDir = await initFixture('cycles-and-repeated-deps');
      await lernaList(testDir)('--scope', 'package-1', '--include-filtered-dependencies');

      // should follow all transitive deps and pass all packages except 7 with no repeats
      expect(logOutput.logged()).toMatchInlineSnapshot(`
package-1
package-2
package-3
package-4
package-5
package-6
`);
    });
  });

  describe('with fancy "packages" configuration', () => {
    it('lists globstar-nested packages', async () => {
      const testDir = await initFixture('globstar');
      await lernaList(testDir)();
      expect(logOutput.logged()).toMatchInlineSnapshot(`
globstar
package-2
package-4
package-1
package-3
package-5
`);
    });

    xit('lists packages under explicitly configured node_modules directories', async () => {
      const testDir = await initFixture('explicit-node-modules');
      await lernaList(testDir)();
      expect(logOutput.logged()).toMatchInlineSnapshot(`
alle-pattern-root
package-1
package-2
package-3
package-4
@scoped/package-5
`);
    });

    it('throws an error when globstars and explicit node_modules configs are mixed', async () => {
      const testDir = await initFixture('mixed-globstar');
      const command = lernaList(testDir)();

      await expect(command).rejects.toThrow('An explicit node_modules package path does not allow globstars');
    });
  });
});
