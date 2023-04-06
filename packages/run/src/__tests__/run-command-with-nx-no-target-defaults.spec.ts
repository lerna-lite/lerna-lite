import { afterAll, beforeAll, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('../lib/npm-run-script');

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  runTopologically: (await vi.importActual<any>('../../../core/src/utils/run-topologically')).runTopologically,
  QueryGraph: (await vi.importActual<any>('../../../core/src/utils/query-graph')).QueryGraph,
}));

// also point to the local run command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/run', async () => await vi.importActual<any>('../run-command'));

// mocked modules
import { npmRunScript, npmRunScriptStreaming } from '../lib/npm-run-script';
import cliRunCommands from '../../../cli/src/cli-commands/cli-run-commands';

// helpers
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { commandRunner, initFixtureFactory, loggingOutput } from '@lerna-test/helpers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const lernaRun = commandRunner(cliRunCommands);
const initFixture = initFixtureFactory(__dirname);

describe('RunCommand', () => {
  (npmRunScript as Mock).mockImplementation((script, { pkg }) => Promise.resolve({ exitCode: 0, stdout: pkg.name }));
  (npmRunScriptStreaming as Mock).mockImplementation(() => Promise.resolve({ exitCode: 0 }));

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
      vi.spyOn(process, 'exit').mockImplementation((code: any) => {
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
      // await new RunCommand(createArgv(testDir, 'my-script'));
      await lernaRun(testDir)('my-script');

      expect(collectedOutput).toContain('package-1');
      expect(collectedOutput).toContain('package-3');
      expect(collectedOutput).toContain('Successfully ran target');

      const logMessages = loggingOutput('verbose');
      expect(logMessages).toContain('Nx target configuration was not found. Task dependencies will not be automatically included.');
    });
  });
});
