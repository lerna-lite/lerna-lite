'use strict';

// FIXME: better mock for version command
jest.mock('../../../version/dist/lib/git-push', () =>
  jest.requireActual('../../../version/src/lib/__mocks__/git-push')
);
jest.mock('../../../version/dist/lib/is-anything-committed', () =>
  jest.requireActual('../../../version/src/lib/__mocks__/is-anything-committed')
);
jest.mock('../../../version/dist/lib/is-behind-upstream', () =>
  jest.requireActual('../../../version/src/lib/__mocks__/is-behind-upstream')
);
jest.mock('../../../version/dist/lib/remote-branch-exists', () =>
  jest.requireActual('../../../version/src/lib/__mocks__/remote-branch-exists')
);

// mocked modules of @lerna-lite/core
jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  collectUpdates: jest.requireActual('../../../core/src/__mocks__/collect-updates').collectUpdates,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
  getOneTimePassword: () => Promise.resolve('654321'),
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../core/src/__mocks__/prompt').promptTextInput,
}));

// also point to the local publish command so that all mocks are properly used even by the command-runner
jest.mock('@lerna-lite/publish', () => jest.requireActual('../publish-command'));

// local modules _must_ be explicitly mocked
jest.mock('../lib/verify-npm-package-access', () => jest.requireActual('../lib/__mocks__/verify-npm-package-access'));
jest.mock('../lib/get-npm-username', () => jest.requireActual('../lib/__mocks__/get-npm-username'));
jest.mock('../lib/get-two-factor-auth-required', () =>
  jest.requireActual('../lib/__mocks__/get-two-factor-auth-required')
);
jest.mock('../lib/create-temp-licenses', () => ({ createTempLicenses: jest.fn(() => Promise.resolve()) }));
jest.mock('../lib/remove-temp-licenses', () => ({ removeTempLicenses: jest.fn(() => Promise.resolve()) }));
jest.mock('../lib/pack-directory', () => jest.requireActual('../lib/__mocks__/pack-directory'));
jest.mock('../lib/npm-publish', () => jest.requireActual('../lib/__mocks__/npm-publish'));

import fs from 'fs-extra';
import path from 'path';

// mocked modules
import { packDirectory } from '../lib/pack-directory';
import { createTempLicenses } from '../lib/create-temp-licenses';
import { removeTempLicenses } from '../lib/remove-temp-licenses';

// helpers
import helpers from '@lerna-test/helpers';
const initFixture = helpers.initFixtureFactory(__dirname);
const { loggingOutput } = require('@lerna-test/helpers/logging-output');

// test command
import { PublishCommand } from '../index';
import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands';
const lernaPublish = helpers.commandRunner(cliCommands);

const yargParser = require('yargs-parser');

const createArgv = (cwd, ...args) => {
  args.unshift('publish');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['cwd'] = cwd;
  return argv;
};

describe('licenses', () => {
  it('makes a temporary copy of the root license text if package has none', async () => {
    const cwd = await initFixture('licenses');
    const packagesToBeLicensed = [expect.objectContaining({ name: 'package-1' })];

    await new PublishCommand(createArgv(cwd));

    expect(createTempLicenses).toHaveBeenLastCalledWith(path.join(cwd, 'LICENSE'), packagesToBeLicensed);
    expect(removeTempLicenses).toHaveBeenLastCalledWith(packagesToBeLicensed);
  });

  it('removes all temporary licenses on error', async () => {
    (packDirectory as any).mockImplementationOnce(() => Promise.reject(new Error('boom')));

    const cwd = await initFixture('licenses');
    const command = new PublishCommand(createArgv(cwd));

    await expect(command).rejects.toThrow('boom');

    expect(removeTempLicenses).toHaveBeenCalledTimes(1);
    expect(removeTempLicenses).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'package-1' })]);
  });

  it('does not override original error when removal rejects', async () => {
    (packDirectory as any).mockImplementationOnce(() => Promise.reject(new Error('boom')));
    (removeTempLicenses as any).mockImplementationOnce(() => Promise.reject(new Error('shaka-lakka')));

    const cwd = await initFixture('licenses');
    const command = new PublishCommand(createArgv(cwd));

    await expect(command).rejects.toThrow('boom');
  });

  it('warns when packages need a license and the root license file is missing', async () => {
    const cwd = await initFixture('licenses-missing');

    await lernaPublish(cwd)('--no-manually-update-root-lockfile');

    const [warning] = loggingOutput('warn');
    expect(warning).toMatchInlineSnapshot(`
  "Packages package-1 and package-3 are missing a license.
  One way to fix this is to add a LICENSE.md file to the root of this repository.
  See https://choosealicense.com for additional guidance."
  `);

    expect(createTempLicenses).toHaveBeenLastCalledWith(undefined, []);
    expect(removeTempLicenses).toHaveBeenLastCalledWith([]);
  });

  // TODO: fix the next 2 tests
  xit('warns when one package needs a license', async () => {
    const cwd = await initFixture('licenses');

    // remove root license so warning is triggered
    await fs.remove(path.join(cwd, 'LICENSE'));

    await lernaPublish(cwd)();

    const [warning] = loggingOutput('warn');
    expect(warning).toMatch('Package package-1 is missing a license.');
  });

  xit('warns when multiple packages need a license', async () => {
    const cwd = await initFixture('licenses-missing');

    // simulate _all_ packages missing a license
    await fs.remove(path.join(cwd, 'packages/package-2/LICENSE'));

    await lernaPublish(cwd)();

    const [warning] = loggingOutput('warn');
    expect(warning).toMatch('Packages package-1, package-2, and package-3 are missing a license.');
  });
});
