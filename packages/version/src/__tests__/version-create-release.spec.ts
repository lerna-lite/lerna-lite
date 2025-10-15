// mocked modules
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logOutput, type VersionCommandOption } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
// helpers
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import dedent from 'dedent';
import { outputFile } from 'fs-extra/esm';
import c from 'tinyrainbow';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import yargParser from 'yargs-parser';
// test command
import cliCommands from '../../../cli/src/cli-commands/cli-version-commands.js';
import { recommendVersion } from '../conventional-commits/recommend-version.js';
import { updateChangelog } from '../conventional-commits/update-changelog.js';
import { createGitHubClient } from '../git-clients/github-client.js';
import { createGitLabClient } from '../git-clients/gitlab-client.js';
import { createRelease, createReleaseClient } from '../lib/create-release.js';
import { VersionCommand } from '../version-command.js';

// local modules _must_ be explicitly mocked
vi.mock('../lib/git-add', async () => await vi.importActual('../lib/__mocks__/git-add'));
vi.mock('../lib/git-commit', async () => await vi.importActual('../lib/__mocks__/git-commit'));
vi.mock('../lib/git-push', async () => await vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/git-tag', async () => await vi.importActual('../lib/__mocks__/git-tag'));
vi.mock('../lib/is-anything-committed', async () => await vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => await vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => await vi.importActual('../lib/__mocks__/remote-branch-exists'));
vi.mock('../conventional-commits/recommend-version', async () => await vi.importActual('../__mocks__/conventional-commits/recommend-version'));
vi.mock('../conventional-commits/update-changelog', async () => await vi.importActual('../__mocks__/conventional-commits/update-changelog'));
vi.mock('../git-clients/gitlab-client', async () => await vi.importActual('../__mocks__/gitlab-client'));
vi.mock('../git-clients/github-client', async () => await vi.importActual('../__mocks__/github-client'));
vi.mock('../lib/create-release', async () => {
  const { createRelease, createReleaseClient } = await vi.importActual<any>('../lib/create-release');
  return {
    createRelease: vi.fn(createRelease),
    createReleaseClient: vi.fn(createReleaseClient),
  };
});

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFixture = initFixtureFactory(__dirname);

const lernaVersion = commandRunner(cliCommands);

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
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_TOKEN;
  });

  it('does not create a release if --no-push is passed', async () => {
    const cwd = await initFixture('independent');

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits', '--no-push'));

    expect(client.releases.size).toBe(0);
  });

  it('throws an error if --conventional-commits is not passed', async () => {
    const cwd = await initFixture('independent');
    const command = lernaVersion(cwd)('--create-release', type);

    await expect(command).rejects.toThrow('To create a release, you must enable --conventional-commits');

    expect(client.releases.size).toBe(0);
  });

  it('throws an error if --generate-release-notes is provided without defining --create-release', async () => {
    const cwd = await initFixture('independent');
    const command = lernaVersion(cwd)('--generate-release-notes');

    await expect(command).rejects.toThrow('To generate release notes, you must define --create-release');

    expect(client.releases.size).toBe(0);
  });

  it('throws an error if --create-release-discussion is provided without defining --create-release', async () => {
    const cwd = await initFixture('independent');
    const command = lernaVersion(cwd)('--create-release-discussion', 'some-discussion');

    await expect(command).rejects.toThrow('To create a release discussion, you must define --create-release');

    expect(client.releases.size).toBe(0);
  });

  it('throws an error if --create-release-discussion is missing a category name', async () => {
    const cwd = await initFixture('independent');
    const command = lernaVersion(cwd)('--create-release', type, '--conventional-commits', '--create-release-discussion');

    await expect(command).rejects.toThrow('A discussion category name must be provided to the --create-release-discussion option.');

    expect(client.releases.size).toBe(0);
  });

  it('throws an error if --no-changelog also passed', async () => {
    const cwd = await initFixture('independent');
    const command = lernaVersion(cwd)('--create-release', type, '--conventional-commits', '--no-changelog');

    await expect(command).rejects.toThrow('To create a release, you cannot pass --no-changelog');

    expect(client.releases.size).toBe(0);
  });

  it('shows a console warning if --no-changelog also passed with --dry-run mode', async () => {
    const logSpy = vi.spyOn(log, 'warn');
    const cwd = await initFixture('independent');

    (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits', '--no-changelog', '--dry-run'));

    expect(logSpy).toHaveBeenCalledWith('ERELEASE', 'To create a release, you cannot pass --no-changelog');
  });

  it('throws an error if environment variables are not present', async () => {
    const cwd = await initFixture('normal');
    const command = lernaVersion(cwd)('--create-release', type, '--conventional-commits');
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
    process.env.GITHUB_TOKEN = 'TOKEN';
    const cwd = await initFixture('independent');
    const versionBumps = new Map([
      ['package-1', '1.0.1'],
      ['package-2', '2.1.0'],
      ['package-3', '4.0.0'],
      ['package-4', '4.1.0'],
      ['package-5', '5.0.1'],
      ['package-6', '0.2.0'],
    ]);

    versionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits'));

    expect(client.releases.size).toBe(6);
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
    process.env.GITHUB_TOKEN = 'TOKEN';
    const logSpy = vi.spyOn(log, 'info');

    const cwd = await initFixture('normal');

    (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits', '--dry-run'));

    expect(logSpy).toHaveBeenCalledWith(c.bold(c.magenta('[dry-run] >')), `Create Release with repo options: `, expect.anything());
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

describe('create --github-release without providing GH_TOKEN or GITHUB_TOKEN', () => {
  beforeEach(() => {
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_TOKEN;
  });

  it('should create a GitHub Release link with prefilled data when GH_TOKEN env var is not provided', async () => {
    const logSpy = vi.spyOn(log, 'info');
    const cwd = await initFixture('normal');

    await lernaVersion(cwd)('--create-release', 'github', '--conventional-commits');

    // prettier-ignore
    const releaseUrl = 'https://github.com/lerna/lerna/releases/new?tag=v1.0.1&title=v1.0.1&body=normal&prerelease=false';
    expect(logSpy).toHaveBeenCalledWith('github', `🏷️ (GitHub Release web interface) - 🔗 ${releaseUrl}`);
  });
});

describe.each([
  ['github', createGitHubClient],
  ['gitlab', createGitLabClient],
])('--create-release %s with version bump only package', (type: any, client: any) => {
  // make "package-4" a version bump only
  const bumpOnlyTextPkg4 = `**Note:** Version bump only for package package-4`;

  beforeEach(() => {
    delete process.env.GH_TOKEN;
    delete process.env.GITHUB_TOKEN;
    (updateChangelog as Mock).mockImplementation((pkg) => {
      const filePath = join(pkg.location, 'CHANGELOG.md');
      if (pkg.name === 'package-4') {
        pkg.isBumpOnlyVersion = true; // updated by updateChangelog() => makeBumpOnlyFilter()
      }
      return outputFile(filePath, 'changelog', 'utf8').then(() => ({
        logPath: filePath,
        newEntry: pkg.name === 'package-4' ? bumpOnlyTextPkg4 : `${pkg.name} - ${pkg.version}`,
      }));
    });
  });

  it('creates a release for every independent version but skip "version bump only" packages when --skip-bump-only-releases is enabled', async () => {
    process.env.GITHUB_TOKEN = 'TOKEN';
    const cwd = await initFixture('independent');
    const versionBumps = new Map([
      ['package-1', '1.0.1'],
      ['package-2', '2.0.1'],
      ['package-3', '4.0.1'],
      ['package-4', '4.0.1'],
      ['package-5', '5.0.1'],
    ]);

    versionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits', '--skip-bump-only-releases'));

    expect(client.releases.size).toBe(5);
    versionBumps.forEach((version, name) => {
      if (name === 'package-4') {
        expect(client.releases.get(`${name}@${version}`)).toBeFalsy();
      } else {
        expect(client.releases.get(`${name}@${version}`)).toEqual({
          owner: 'lerna',
          repo: 'lerna',
          tag_name: `${name}@${version}`,
          name: `${name}@${version}`,
          body: `${name} - ${version}`,
          draft: false,
          prerelease: false,
        });
      }
    });
  });

  it('creates a release for every independent version even with "version bump only" packages when --skip-bump-only-releases is NOT enabled', async () => {
    process.env.GH_TOKEN = 'TOKEN';
    const cwd = await initFixture('independent');
    const versionBumps = new Map([
      ['package-1', '1.0.1'],
      ['package-2', '2.0.1'],
      ['package-3', '4.0.1'],
      ['package-4', '4.0.1'],
      ['package-5', '5.0.1'],
    ]);

    versionBumps.forEach((bump) => (recommendVersion as Mock).mockResolvedValueOnce(bump));

    await new VersionCommand(createArgv(cwd, '--create-release', type, '--conventional-commits'));

    expect(client.releases.size).toBe(6);
    versionBumps.forEach((version, name) => {
      expect(client.releases.get(`${name}@${version}`)).toEqual({
        owner: 'lerna',
        repo: 'lerna',
        tag_name: `${name}@${version}`,
        name: `${name}@${version}`,
        body: name === 'package-4' ? bumpOnlyTextPkg4 : `${name} - ${version}`,
        draft: false,
        prerelease: false,
      });
    });
  });
});

it('should create a github release discussion when enabled', async () => {
  process.env.GH_TOKEN = 'TOKEN';
  const createReleaseMock = vi.fn(() => Promise.resolve(true));
  (createReleaseClient as Mock).mockImplementation(() => Promise.resolve({ repos: { createRelease: createReleaseMock } }));

  const cwd = await initFixture('normal');

  (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

  const command = new VersionCommand(createArgv(cwd, '--create-release', 'github', '--conventional-commits', '--create-release-discussion', 'some-discussion'));
  await command;
  await command.execute();

  expect(createReleaseMock).toHaveBeenCalledWith({
    owner: 'lerna',
    repo: 'lerna',
    tag_name: 'v1.1.0',
    name: 'v1.1.0',
    body: expect.stringContaining('normal'),
    draft: false,
    prerelease: false,
    discussion_category_name: 'some-discussion',
  });
});

it('should create a github release and generate release notes with changelog', async () => {
  process.env.GH_TOKEN = 'TOKEN';
  const createReleaseMock = vi.fn(() => Promise.resolve(true));
  (createReleaseClient as Mock).mockImplementation(() => Promise.resolve({ repos: { createRelease: createReleaseMock } }));

  const cwd = await initFixture('normal');

  (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

  const command = new VersionCommand(createArgv(cwd, '--create-release', 'github', '--conventional-commits', '--generate-release-notes'));
  await command;
  await command.execute();

  expect(createReleaseMock).toHaveBeenCalledWith({
    owner: 'lerna',
    repo: 'lerna',
    tag_name: 'v1.1.0',
    draft: false,
    generate_release_notes: true,
    prerelease: false,
  });
});

it('should create a github release and generate release notes with --no-changelog', async () => {
  process.env.GH_TOKEN = 'TOKEN';
  const createReleaseMock = vi.fn(() => Promise.resolve(true));
  (createReleaseClient as Mock).mockImplementation(() => Promise.resolve({ repos: { createRelease: createReleaseMock } }));

  const cwd = await initFixture('normal');

  (recommendVersion as Mock).mockResolvedValueOnce('1.1.0');

  const command = new VersionCommand(createArgv(cwd, '--create-release', 'github', '--conventional-commits', '--generate-release-notes', '--no-changelog'));
  await command;
  await command.execute();

  expect(createReleaseMock).toHaveBeenCalledWith({
    owner: 'lerna',
    repo: 'lerna',
    tag_name: 'v1.1.0',
    draft: false,
    generate_release_notes: true,
    prerelease: false,
  });
});

it('should log an error when createRelease throws', async () => {
  process.env.GITHUB_TOKEN = 'TOKEN';
  (createReleaseClient as Mock).mockImplementation(() => Promise.resolve({ repos: { createRelease: vi.fn(() => Promise.reject('some error')) } }));
  (createRelease as Mock).mockImplementationOnce(() => {
    throw new Error('some error');
  });
  const cwd = await initFixture('normal');
  const command = new VersionCommand(createArgv(cwd, '--conventional-commits', '--create-release', 'github', '--create-release-discussion', 'some-discussion'));
  await command;
  const loggerSpy = vi.spyOn(command.logger, 'error');
  await command.execute();

  expect(loggerSpy).toHaveBeenCalledWith('ERELEASE', 'Something went wrong when creating the github release. Error:: some error');
  expect((createGitHubClient as any).releases.size).toBe(0);
  expect((createGitLabClient as any).releases.size).toBe(0);
});
