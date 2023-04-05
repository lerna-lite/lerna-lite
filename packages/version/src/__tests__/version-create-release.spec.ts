// local modules _must_ be explicitly mocked
vi.mock('../lib/git-add', async () => await vi.importActual('../lib/__mocks__/git-add'));
vi.mock('../lib/git-commit', async () => await vi.importActual('../lib/__mocks__/git-commit'));
vi.mock('../lib/git-push', async () => await vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/git-tag', async () => await vi.importActual('../lib/__mocks__/git-tag'));
vi.mock('../lib/is-anything-committed', async () => await vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => await vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => await vi.importActual('../lib/__mocks__/remote-branch-exists'));
vi.mock('../conventional-commits', async () => await vi.importActual('../__mocks__/conventional-commits'));
vi.mock('../git-clients/gitlab-client', async () => await vi.importActual('../__mocks__/gitlab-client'));
vi.mock('../git-clients/github-client', async () => await vi.importActual('../__mocks__/github-client'));

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));

// also point to the local version command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/version', async () => await vi.importActual('../version-command'));

// mocked modules
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { logOutput, VersionCommandOption } from '@lerna-lite/core';
import { recommendVersion } from '../conventional-commits';
import { createGitHubClient, createGitLabClient } from '../git-clients';

// helpers
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(__dirname);

// test command
import { VersionCommand } from '../version-command';
import cliCommands from '../../../cli/src/cli-commands/cli-version-commands';
const lernaVersion = commandRunner(cliCommands);

import chalk from 'chalk';
import dedent from 'dedent';
import npmlog from 'npmlog';
import { Mock } from 'vitest';
import yargParser from 'yargs-parser';

const createArgv = (cwd: string, ...args: any[]) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv as unknown as VersionCommandOption;
};

describe.each([
  ['github', createGitHubClient],
  ['gitlab', createGitLabClient],
])('--create-release %s', (type: any, client: any) => {
  beforeEach(() => {
    process.env = {};
  });

  it('does not create a release if --no-push is passed', async () => {
    const cwd = await initFixture('independent');

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits', '--no-push'));

    expect(client.releases.size).toBe(0);
  });

  it('throws an error if --conventional-commits is not passed', async () => {
    const cwd = await initFixture('independent');
    const command = new VersionCommand(createArgv(cwd, '--create-release', type));

    await expect(command).rejects.toThrow('To create a release, you must enable --conventional-commits');

    expect(client.releases.size).toBe(0);
  });

  it('throws an error if --no-changelog also passed', async () => {
    const cwd = await initFixture('independent');
    const command = new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits', '--no-changelog'));

    await expect(command).rejects.toThrow('To create a release, you cannot pass --no-changelog');

    expect(client.releases.size).toBe(0);
  });

  it('throws an error if environment variables are not present', async () => {
    const cwd = await initFixture('normal');
    const command = new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits'));
    const message = `Environment variables for ${type} are missing!`;

    client.mockImplementationOnce(() => {
      throw new Error(message);
    });

    await expect(command).rejects.toThrow(message);

    expect(client.releases.size).toBe(0);
  });

  it('marks a version as a pre-release if it contains a valid part', async () => {
    process.env.GH_TOKEN = 'TOKEN';
    const cwd = await initFixture('normal');

    (recommendVersion as Mock).mockResolvedValueOnce('2.0.0-alpha.1');

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits'));

    expect(client.releases.size).toBe(1);
    expect(client.releases.get('v2.0.0-alpha.1')).toEqual({
      owner: 'lerna',
      repo: 'lerna',
      tag_name: 'v2.0.0-alpha.1',
      name: 'v2.0.0-alpha.1',
      body: 'normal',
      draft: false,
      prerelease: true,
    });
  });

  it('creates a release for every independent version', async () => {
    process.env.GH_TOKEN = 'TOKEN';
    const cwd = await initFixture('independent');
    const versionBumps = new Map([
      ['package-1', '1.0.1'],
      ['package-2', '2.1.0'],
      ['package-3', '4.0.0'],
      ['package-4', '4.1.0'],
      ['package-5', '5.0.1'],
    ]);

    versionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits'));

    expect(client.releases.size).toBe(5);
    versionBumps.forEach((version, name) => {
      expect(client.releases.get(`${name}@${version}`)).toEqual({
        owner: 'lerna',
        repo: 'lerna',
        tag_name: `${name}@${version}`,
        name: `${name}@${version}`,
        body: `${name} - ${version}`,
        draft: false,
        prerelease: false,
      });
    });
  });

  it('creates a single fixed release', async () => {
    process.env.GH_TOKEN = 'TOKEN';

    const cwd = await initFixture('normal');

    (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits'));

    expect(client.releases.size).toBe(1);
    expect(client.releases.get('v1.1.0')).toEqual({
      owner: 'lerna',
      repo: 'lerna',
      tag_name: 'v1.1.0',
      name: 'v1.1.0',
      body: 'normal',
      draft: false,
      prerelease: false,
    });
  });

  it('creates a single fixed release in dry-run mode', async () => {
    process.env.GH_TOKEN = 'TOKEN';
    const logSpy = vi.spyOn(npmlog, 'info');

    const cwd = await initFixture('normal');

    (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits', '--dry-run'));

    expect(logSpy).toHaveBeenCalledWith(chalk.bold.magenta('[dry-run] >'), `Create Release with repo options: `, expect.anything());
  });

  it('creates a single fixed release in git dry-run mode', async () => {
    const cwd = await initFixture('normal');

    (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits', '--dry-run'));

    expect((logOutput as any).logged()).toMatch(dedent`
    Changes (5 packages):
     - package-1: 1.0.0 => 1.1.0
     - package-2: 1.0.0 => 1.1.0
     - package-3: 1.0.0 => 1.1.0
     - package-4: 1.0.0 => 1.1.0
     - package-5: 1.0.0 => 1.1.0 (private)
    `);
  });
});

describe('--create-release [unrecognized]', () => {
  it('throws an error', async () => {
    const cwd = await initFixture('normal');
    const command = new VersionCommand(createArgv(cwd, '--conventional-commits', '--create-release', 'poopypants'));

    await expect(command).rejects.toThrow('Invalid release client type');

    expect((createGitHubClient as any).releases.size).toBe(0);
    expect((createGitLabClient as any).releases.size).toBe(0);
  });
});

describe('create --github-release without providing GH_TOKEN', () => {
  beforeEach(() => {
    process.env = {};
  });

  it('should create a GitHub Release link with prefilled data when GH_TOKEN env var is not provided', async () => {
    const logSpy = vi.spyOn(npmlog, 'info');
    const cwd = await initFixture('normal');

    await lernaVersion(cwd)('--create-release', 'github', '--conventional-commits');

    // prettier-ignore
    const releaseUrl = 'https://github.com/lerna/lerna/releases/new?tag=v1.0.1&title=v1.0.1&body=normal&prerelease=false';
    expect(logSpy).toHaveBeenCalledWith('github', `🏷️ (GitHub Release web interface) - 🔗 ${releaseUrl}`);
  });
});
