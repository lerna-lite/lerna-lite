import { beforeAll, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('nx/src/utils/output', () => undefined);
vi.mock('../lib/npm-run-script');

// also point to the local run command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/run', async () => await vi.importActual('../run-command'));

// mocked modules
import { npmRunScript } from '../lib/npm-run-script';
import cliRunCommands from '../../../cli/src/cli-commands/cli-run-commands';

// helpers
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';

const lernaRun = commandRunner(cliRunCommands);
const initFixture = initFixtureFactory(__dirname);

describe('RunCommand', () => {
  (npmRunScript as Mock).mockImplementation((_script, { pkg }) => Promise.resolve({ exitCode: 0, stdout: pkg.name }));

  describe('in a repo powered by Nx', () => {
    let testDir;
    const errorSpy = vi.fn();

    beforeAll(async () => {
      testDir = await initFixture('powered-by-nx');
      process.env.NX_WORKSPACE_ROOT_PATH = testDir;
      process.env.NX_DAEMON = 'false';

      // @ts-ignore
      vi.spyOn(process, 'exit').mockImplementation((code: any) => {
        if (code !== 0) {
          errorSpy(code);
        }
      });
    });

    it('should throw when Nx is not loaded', async () => {
      await lernaRun(testDir)('my-script');

      expect(errorSpy).toHaveBeenCalledWith(1);
    });
  });
});
