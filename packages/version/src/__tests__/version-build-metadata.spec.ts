import { describe, expect, it, Mock, test, vi } from 'vitest';

// local modules _must_ be explicitly mocked
vi.mock('../lib/git-push', async () => await vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/is-anything-committed', async () => await vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => await vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => await vi.importActual('../lib/__mocks__/remote-branch-exists'));

// mocked modules of @lerna-lite/core
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
vi.mock('@lerna-lite/version', async () => vi.importActual('../version-command'));

import { PackageGraphNode, promptSelectOne, promptTextInput, VersionCommandOption } from '@lerna-lite/core';
import { makePromptVersion } from '../lib/prompt-version';

import { dirname, resolve as pathResolve } from 'node:path';
import yargParser from 'yargs-parser';

expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

const resolvePrereleaseId = vi.fn(() => 'alpha');
const versionPrompt = (buildMetadata) => makePromptVersion(resolvePrereleaseId, buildMetadata);

// helpers
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(pathResolve(__dirname, '../../../publish/src/__tests__'));
import { showCommit } from '@lerna-test/helpers';

// test command
import { VersionCommand } from '../version-command';
import cliCommands from '../../../cli/src/cli-commands/cli-version-commands';
const lernaVersion = commandRunner(cliCommands);

const createArgv = (cwd, ...args) => {
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

describe('--build-metadata without prompt', () => {
  it('accepts build metadata for explicit version', async () => {
    const testDir = await initFixture('normal');
    await new VersionCommand(createArgv(testDir, '--bump', '1.0.1', '--build-metadata', '20130313144700'));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('updates build metadata for explicit version', async () => {
    const testDir = await initFixture('build-metadata');
    await new VersionCommand(createArgv(testDir, '--bump', '1.0.1', '--build-metadata', '20130313144700'));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('accepts build metadata for repository version', async () => {
    const testDir = await initFixture('normal');
    await lernaVersion(testDir)('--bump', '1.0.2', '--build-metadata', '21AF26D3--117B344092BD');

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('accepts build metadata with semver keyword', async () => {
    const testDir = await initFixture('normal');
    await new VersionCommand(createArgv(testDir, '--bump', 'minor', '--build-metadata', '001'));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('accepts build metadata with default prerelease id', async () => {
    const testDir = await initFixture('normal');
    await new VersionCommand(createArgv(testDir, '--bump', 'prerelease', '--build-metadata', '20130313144700'));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('accepts build metadata across independent versions with semver keyword', async () => {
    const testDir = await initFixture('independent');
    await new VersionCommand(createArgv(testDir, '--bump', 'minor', '--build-metadata', '001'));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('updates build metadata across independent versions with semver keyword', async () => {
    const testDir = await initFixture('independent-build-metadata');
    await new VersionCommand(createArgv(testDir, '--bump', 'minor', '--build-metadata', 'exp.sha.5114f85'));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });
});

describe('--build-metadata with prompt', () => {
  it('accepts build metadata', async () => {
    const testDir = await initFixture('normal');
    (promptSelectOne as any).chooseBump('minor');

    await new VersionCommand(createArgv(testDir, '--build-metadata', '20130313144700'));

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('updates build metadata', async () => {
    const testDir = await initFixture('build-metadata');
    (promptSelectOne as any).chooseBump('minor');

    await new VersionCommand(createArgv(testDir, '--build-metadata', '20130313144700'));

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('accepts build metadata across independent versions', async () => {
    const testDir = await initFixture('independent');
    (promptSelectOne as any).chooseBump('patch');
    (promptSelectOne as any).chooseBump('minor');
    (promptSelectOne as any).chooseBump('major');
    (promptSelectOne as any).chooseBump('minor');
    (promptSelectOne as any).chooseBump('patch');

    await new VersionCommand(createArgv(testDir, '--build-metadata', '21AF26D3--117B344092BD'));

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it('updates build metadata across independent versions', async () => {
    const testDir = await initFixture('independent-build-metadata');
    (promptSelectOne as any).chooseBump('patch');
    (promptSelectOne as any).chooseBump('minor');

    await new VersionCommand(createArgv(testDir, '--build-metadata', 'exp.sha.5114f85'));

    expect(promptSelectOne).toHaveBeenCalled();

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });
});

describe('--build-metadata in version prompt', () => {
  test.each([
    ['patch', '1.0.1+001'],
    ['minor', '1.1.0+001'],
    ['major', '2.0.0+001'],
    ['prepatch', '1.0.1-alpha.0+001'],
    ['preminor', '1.1.0-alpha.0+001'],
    ['premajor', '2.0.0-alpha.0+001'],
  ])('accepts build metadata for prompted choice %s', async (bump, result) => {
    (promptSelectOne as any).chooseBump(bump);

    const choice = await versionPrompt('001')({ version: '1.0.0' } as PackageGraphNode);

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      'Select a new version (currently 1.0.0)',
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(choice).toBe(result);
  });

  it('updates build metadata for prompted choice', async () => {
    (promptSelectOne as any).chooseBump('patch');

    const choice = await versionPrompt('20130313144700')({ version: '1.0.0+001' } as PackageGraphNode);

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      'Select a new version (currently 1.0.0+001)',
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(choice).toBe('1.0.1+20130313144700');
  });

  it('accepts build metadata for prompted prerelease version', async () => {
    let inputFilter;

    (promptSelectOne as any).chooseBump('PRERELEASE');
    (promptTextInput as Mock).mockImplementationOnce((msg, cfg) => {
      inputFilter = cfg.filter;
      return Promise.resolve(msg);
    });

    await versionPrompt('exp.sha.5114f85')({ version: '1.0.0' } as PackageGraphNode);

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      'Select a new version (currently 1.0.0)',
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(inputFilter('rc')).toBe('1.0.1-rc.0+exp.sha.5114f85');
  });

  it('accepts build metadata for prompted custom version', async () => {
    let inputFilter;
    let inputValidate;

    (promptSelectOne as any).chooseBump('CUSTOM');
    (promptTextInput as Mock).mockImplementationOnce((msg, cfg) => {
      inputFilter = cfg.filter;
      inputValidate = cfg.validate;
      return Promise.resolve(msg);
    });

    await versionPrompt('20130313144700')({ version: '1.0.0' } as PackageGraphNode);

    expect(promptSelectOne).toHaveBeenLastCalledWith(
      'Select a new version (currently 1.0.0)',
      expect.objectContaining({
        choices: expect.any(Array),
      })
    );
    expect(inputValidate(inputFilter('2.0.0+20130313144700'))).toBe(true);
  });
});
