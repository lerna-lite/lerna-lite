jest.mock('nx/src/utils/output', () => undefined);
jest.mock('../lib/npm-run-script');

// also point to the local run command so that all mocks are properly used even by the command-runner
jest.mock('@lerna-lite/run', () => jest.requireActual('../run-command'));

// mocked modules
import { npmRunScript } from '../lib/npm-run-script';
import cliRunCommands from '../../../cli/src/cli-commands/cli-run-commands';

// helpers
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
const lernaRun = commandRunner(cliRunCommands);
const initFixture = initFixtureFactory(__dirname);

describe('RunCommand', () => {
  (npmRunScript as jest.Mock).mockImplementation((script, { pkg }) =>
    Promise.resolve({ exitCode: 0, stdout: pkg.name })
  );

  describe('in a repo powered by Nx', () => {
    let testDir;
    let errorSpy = jest.fn();

    beforeAll(async () => {
      testDir = await initFixture('powered-by-nx');
      process.env.NX_WORKSPACE_ROOT_PATH = testDir;

      // @ts-ignore
      jest.spyOn(process, 'exit').mockImplementation((code: any) => {
        if (code !== 0) {
          errorSpy(code);
        }
      });
    });

    it('should throw when Nx is not loaded', async () => {
      const command = lernaRun(testDir)('my-script');

      await expect(command).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(1);
    });
  });
});
