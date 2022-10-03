jest.mock('../lib/npm-run-script');

jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  runTopologically: jest.requireActual('../../../core/src/utils/run-topologically').runTopologically,
  QueryGraph: jest.requireActual('../../../core/src/utils/query-graph').QueryGraph,
}));

// also point to the local run command so that all mocks are properly used even by the command-runner
jest.mock('@lerna-lite/run', () => jest.requireActual('../run-command'));

// mocked modules
import { npmRunScript, npmRunScriptStreaming } from '../lib/npm-run-script';
import cliRunCommands from '../../../cli/src/cli-commands/cli-run-commands';

// helpers
import { commandRunner, initFixtureFactory, loggingOutput, normalizeRelativeDir } from '@lerna-test/helpers';
const lernaRun = commandRunner(cliRunCommands);
const initFixture = initFixtureFactory(__dirname);

describe('RunCommand', () => {
  (npmRunScript as jest.Mock).mockImplementation((script, { pkg }) =>
    Promise.resolve({ exitCode: 0, stdout: pkg.name })
  );
  (npmRunScriptStreaming as jest.Mock).mockImplementation(() => Promise.resolve({ exitCode: 0 }));

  afterEach(() => {
    process.exitCode = undefined;
  });

  // this is a temporary set of tests, which will be replaced by verdacio-driven tests
  // once the required setup is fully set up
  describe('in a repo powered by Nx without defaultTargets', () => {
    let testDir;
    let collectedOutput = '';
    let originalStdout;

    beforeAll(async () => {
      testDir = await initFixture('powered-by-nx');
      process.env.NX_WORKSPACE_ROOT_PATH = testDir;
      // @ts-ignore
      jest.spyOn(process, 'exit').mockImplementation((code: any) => {
        if (code !== 0) {
          throw new Error();
        }
      });
      originalStdout = process.stdout.write;
      (process.stdout as any).write = (v) => {
        collectedOutput = `${collectedOutput}\n${v}`;
      };
    });

    afterAll(() => {
      process.stdout.write = originalStdout;
    });

    it('runs a script in packages', async () => {
      collectedOutput = '';
      await lernaRun(testDir)('my-script');

      expect(collectedOutput).toContain('package-1');
      expect(collectedOutput).toContain('package-3');
      expect(collectedOutput).toContain('Successfully ran target');

      const logMessages = loggingOutput('verbose');
      expect(logMessages).toContain(
        'nx.json was not found or is missing targetDefaults. Task dependencies will not be automatically included.'
      );
    });
  });
});
