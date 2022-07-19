jest.mock('envinfo');

import path from 'path';
import envinfo from 'envinfo';

(envinfo.run as any).mockResolvedValue('MOCK_ENVINFO');

// mocked modules of @lerna-lite/core
jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
}));

const { logOutput } = require('@lerna-lite/core');

// file under test
import helpers from '@lerna-test/helpers';
import { InfoCommand } from '../index';
import { factory } from '../info-command';
import cliInfoCommands from '../../../cli/src/cli-commands/cli-info-commands';
const lernaInfo = helpers.commandRunner(cliInfoCommands);

describe('Info Command', () => {
  it('outputs result of envinfo() via CLI', async () => {
    // project fixture is irrelevant, no actual changes are made
    await lernaInfo(path.resolve(__dirname, '../../..'))();

    expect(envinfo.run).toHaveBeenLastCalledWith(
      expect.objectContaining({
        npmPackages: ['lerna'],
      })
    );
    expect(logOutput.logged()).toMatch('MOCK_ENVINFO');
  });

  it('outputs result of envinfo() via factory', async () => {
    // project fixture is irrelevant, no actual changes are made
    await new InfoCommand({});

    expect(envinfo.run).toHaveBeenLastCalledWith(
      expect.objectContaining({
        npmPackages: ['lerna'],
      })
    );
    expect(logOutput.logged()).toMatch('MOCK_ENVINFO');
  });

  it('outputs result of envinfo() via InfoCommand class', async () => {
    // project fixture is irrelevant, no actual changes are made
    await factory({});

    expect(envinfo.run).toHaveBeenLastCalledWith(
      expect.objectContaining({
        npmPackages: ['lerna'],
      })
    );
    expect(logOutput.logged()).toMatch('MOCK_ENVINFO');
  });
});
