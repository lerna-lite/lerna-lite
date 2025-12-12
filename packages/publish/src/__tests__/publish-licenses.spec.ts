import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PublishCommandOption } from '@lerna-lite/core';
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { loggingOutput } from '@lerna-test/helpers/logging-output.js';
import { remove } from 'fs-extra/esm';
import { describe, expect, it, vi, type Mock } from 'vitest';
import yargParser from 'yargs-parser';

import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands.js';
import { PublishCommand } from '../index.js';
import { createTempLicenses } from '../lib/create-temp-licenses.js';
import { packDirectory } from '../lib/pack-directory.js';
import { removeTempLicenses } from '../lib/remove-temp-licenses.js';

// FIXME: better mock for version command
vi.mock('../../../version/src/lib/git-push', async () => await vi.importActual('../../../version/src/lib/__mocks__/git-push'));
vi.mock(
  '../../../version/src/lib/is-anything-committed',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/is-anything-committed')
);
vi.mock(
  '../../../version/src/lib/is-behind-upstream',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/is-behind-upstream')
);
vi.mock(
  '../../../version/src/lib/remote-branch-exists',
  async () => await vi.importActual('../../../version/src/lib/__mocks__/remote-branch-exists')
);

// mocked modules of @lerna-lite/core
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
  getOneTimePassword: () => Promise.resolve('654321'),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
}));

// also point to the local publish command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/publish', async () => await vi.importActual('../publish-command'));
vi.mock('@lerna-lite/version', async () => ({
  ...(await vi.importActual<any>('../../../version/src/version-command')),
  getOldestCommitSinceLastTag: vi.fn(),
}));

// local modules _must_ be explicitly mocked
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock(
  '../lib/get-two-factor-auth-required',
  async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required')
);
vi.mock('../lib/create-temp-licenses', () => ({ createTempLicenses: vi.fn(() => Promise.resolve()) }));
vi.mock('../lib/remove-temp-licenses', () => ({ removeTempLicenses: vi.fn(() => Promise.resolve()) }));
vi.mock('../lib/pack-directory', async () => await vi.importActual('../lib/__mocks__/pack-directory'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFixture = initFixtureFactory(__dirname);

const lernaPublish = commandRunner(cliCommands);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('publish');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['cwd'] = cwd;
  return argv as unknown as PublishCommandOption;
};

describe('licenses', () => {
  it('makes a temporary copy of the root license text if package has none', async () => {
    const cwd = await initFixture('licenses');
    const packagesToBeLicensed = [expect.objectContaining({ name: 'package-1' })];

    await new PublishCommand(createArgv(cwd));

    expect(createTempLicenses).toHaveBeenLastCalledWith(join(cwd, 'LICENSE'), packagesToBeLicensed);
    expect(removeTempLicenses).toHaveBeenLastCalledWith(packagesToBeLicensed);
  });

  it('removes all temporary licenses on error', async () => {
    (packDirectory as Mock).mockImplementationOnce(() => Promise.reject(new Error('boom')));

    const cwd = await initFixture('licenses');
    const command = new PublishCommand(createArgv(cwd));

    await expect(command).rejects.toThrow('boom');

    expect(removeTempLicenses).toHaveBeenCalledTimes(1);
    expect(removeTempLicenses).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'package-1' })]);
  });

  it('does not override original error when removal rejects', async () => {
    (packDirectory as Mock).mockImplementationOnce(() => Promise.reject(new Error('boom')));
    (removeTempLicenses as Mock).mockImplementationOnce(() => Promise.reject(new Error('shaka-lakka')));

    const cwd = await initFixture('licenses');
    const command = new PublishCommand(createArgv(cwd));

    await expect(command).rejects.toThrow('boom');
  });

  it('warns when packages need a license and the root license file is missing', async () => {
    const cwd = await initFixture('licenses-missing');

    await lernaPublish(cwd)('--no-manually-update-root-lockfile');

    const [warning] = loggingOutput('warn');
    expect(warning).toBe(
      'Packages package-1 and package-3 are missing a license.\n' +
        'One way to fix this is to add a LICENSE.md file to the root of this repository.\n' +
        'See https://choosealicense.com for additional guidance.'
    );

    expect(createTempLicenses).toHaveBeenLastCalledWith(undefined, []);
    expect(removeTempLicenses).toHaveBeenLastCalledWith([]);
  });

  // TODO: fix the next 2 tests
  // oxlint-disable-next-line no-disabled-tests
  it.skip('warns when one package needs a license', async () => {
    const cwd = await initFixture('licenses');

    // remove root license so warning is triggered
    await remove(join(cwd, 'LICENSE'));

    await lernaPublish(cwd)();

    const [warning] = loggingOutput('warn');
    expect(warning).toMatch('Package package-1 is missing a license.');
  });

  // oxlint-disable-next-line no-disabled-tests
  it.skip('warns when multiple packages need a license', async () => {
    const cwd = await initFixture('licenses-missing');

    // simulate _all_ packages missing a license
    await remove(join(cwd, 'packages/package-2/LICENSE'));

    await lernaPublish(cwd)();

    const [warning] = loggingOutput('warn');
    expect(warning).toMatch('Packages package-1, package-2, and package-3 are missing a license.');
  });
});
