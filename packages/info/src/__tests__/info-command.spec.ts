jest.mock('envinfo');

import path from 'path';
import envinfo from 'envinfo';

(envinfo.run as jest.Mock).mockResolvedValue('MOCK_ENVINFO');

// mocked modules of @lerna-lite/core
jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  Command: jest.requireActual('../../../core/src/command').Command,
  conf: jest.requireActual('../../../core/src/command').conf,
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
}));

import { logOutput } from '@lerna-lite/core';

// file under test
import { InfoCommand } from '../index';
import { factory } from '../info-command';
import cliInfoCommands from '../../../cli/src/cli-commands/cli-info-commands';
import { commandRunner } from '@lerna-test/helpers';
const lernaInfo = commandRunner(cliInfoCommands);

describe('Info Command', () => {
  it('outputs result of envinfo() via CLI', async () => {
    // project fixture is irrelevant, no actual changes are made
    await lernaInfo(path.resolve(__dirname, '../../..'))();

    expect(envinfo.run).toHaveBeenLastCalledWith(
      expect.objectContaining({
        npmPackages: ['lerna'],
      })
    );
    expect((logOutput as any).logged()).toMatch('MOCK_ENVINFO');
  });

  it('outputs result of envinfo() via factory', async () => {
    // project fixture is irrelevant, no actual changes are made
    await new InfoCommand({});

    expect(envinfo.run).toHaveBeenLastCalledWith(
      expect.objectContaining({
        npmPackages: ['lerna'],
      })
    );
    expect((logOutput as any).logged()).toMatch('MOCK_ENVINFO');
  });

  it('outputs result of envinfo() via InfoCommand class', async () => {
    // project fixture is irrelevant, no actual changes are made
    await factory({});

    expect(envinfo.run).toHaveBeenLastCalledWith(
      expect.objectContaining({
        npmPackages: ['lerna'],
      })
    );
    expect((logOutput as any).logged()).toMatch('MOCK_ENVINFO');
  });
});
