import nodeFs from 'node:fs';

import { describe, expect, it, test, vi } from 'vitest';
vi.spyOn(nodeFs, 'renameSync');

// local modules _must_ be explicitly mocked
vi.mock('../lib/git-push', async () => await vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/is-anything-committed', async () => await vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => await vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => await vi.importActual('../lib/__mocks__/remote-branch-exists'));

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

import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// mocked modules
import { promptSelectOne, VersionCommandOption } from '@lerna-lite/core';
import yargParser from 'yargs-parser';

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(pathResolve(__dirname, '../../../publish/src/__tests__'));
import { getCommitMessage } from '@lerna-test/helpers';

import cliCommands from '../../../cli/src/cli-commands/cli-version-commands.js';
// test command
import { factory, VersionCommand } from '../version-command.js';
const lernaVersion = commandRunner(cliCommands);

const createArgv = (cwd: string, ...args: string[]) => {
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

describe('version bump', () => {
  it('accepts explicit versions', async () => {
    const testDir = await initFixture('normal');
    await new VersionCommand(createArgv(testDir, '--bump', '1.0.1-beta.25'));

    expect(promptSelectOne).not.toHaveBeenCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe('v1.0.1-beta.25');
  });

  it('strips invalid semver information from explicit value', async () => {
    const testDir = await initFixture('normal');
    // await new VersionCommand(createArgv(testDir, "--bump", "v1.2.0-beta.1+deadbeef"));
    await lernaVersion(testDir)('v1.2.0-beta.1+deadbeef');

    const message = await getCommitMessage(testDir);
    expect(message).toBe('v1.2.0-beta.1');
  });

  it('accepts semver keywords', async () => {
    const testDir = await initFixture('normal');
    // await new VersionCommand(createArgv(testDir, "--bump", "minor"));
    await lernaVersion(testDir)('minor');

    expect(promptSelectOne).not.toHaveBeenCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe('v1.1.0');
  });

  it.skip('throws an error when an invalid semver keyword is used', async () => {
    const testDir = await initFixture('normal');
    // const command = await new VersionCommand(createArgv(testDir, "--bump", "poopypants"));
    const command = lernaVersion(testDir)('poopypants');

    await expect(command).rejects.toThrow(
      'bump must be an explicit version string _or_ one of: ' + "'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'."
    );
  });

  it('should call getPackagesForOption() with a csv string and expect it to return a Set of the split csv string', async () => {
    const testDir = await initFixture('independent');

    const command = new VersionCommand(createArgv(testDir, '--bump', 'prerelease'));
    const pkgNames = command.getPackagesForOption('foo,bar');

    expect(pkgNames).toEqual(new Set(['foo', 'bar']));
  });

  it('should call getPackagesForOption() with the same option called twice and expect it to return a Set of these 2 options', async () => {
    const testDir = await initFixture('independent');

    const command = new VersionCommand(createArgv(testDir, '--bump', 'prerelease'));
    const pkgNames = command.getPackagesForOption(['--force-publish foo', '--force-publish baz']);

    expect(pkgNames).toEqual(new Set(['--force-publish foo', '--force-publish baz']));
  });

  test('prerelease increments version with default --preid', async () => {
    const testDir = await initFixture('independent');

    // await new VersionCommand(createArgv(testDir, "--bump", "prerelease"));
    await factory(createArgv(testDir, '--bump', 'prerelease'));

    const message = await getCommitMessage(testDir);
    expect(message).toContain('package-1@1.0.1-alpha.0');
    // TODO: (major) make --no-private the default
    expect(message).toContain('package-5@5.0.1-alpha.0');
  });

  test('prerelease increments version for the filtered packages when providing a --scope', async () => {
    const testDir = await initFixture('independent');

    // await new VersionCommand(createArgv(testDir, "--bump", "prerelease"));
    await factory(createArgv(testDir, '--bump', 'prerelease', '--scope', 'package-1'));

    const message = await getCommitMessage(testDir);
    expect(message).toContain('package-1@1.0.1-alpha.0');
    expect(message).not.toContain('package-2@1.0.1-alpha.0');
    expect(message).not.toContain('package-3@1.0.1-alpha.0');
    expect(message).not.toContain('package-4@1.0.1-alpha.0');
    expect(message).not.toContain('package-5@1.0.1-alpha.0');
    expect(message).not.toContain('package-6@1.0.1-alpha.0');
  });

  test('prerelease increments version only for the packages that are not --ignore(d)', async () => {
    const testDir = await initFixture('independent');

    // await new VersionCommand(createArgv(testDir, "--bump", "prerelease"));
    await factory(createArgv(testDir, '--bump', 'prerelease', '--ignore', 'package-@(2|3|4|5|6)'));

    const message = await getCommitMessage(testDir);
    expect(message).toContain('package-1@1.0.1-alpha.0');
    expect(message).not.toContain('package-2@1.0.1-alpha.0');
    expect(message).not.toContain('package-3@1.0.1-alpha.0');
    expect(message).not.toContain('package-4@1.0.1-alpha.0');
    expect(message).not.toContain('package-5@1.0.1-alpha.0');
    expect(message).not.toContain('package-6@1.0.1-alpha.0');
  });

  test('prerelease increments version with custom --preid', async () => {
    const testDir = await initFixture('independent');

    await new VersionCommand(createArgv(testDir, '--bump', 'prerelease', '--preid', 'foo'));

    const message = await getCommitMessage(testDir);
    expect(message).toContain('package-1@1.0.1-foo.0');
  });

  it('ignores private packages with --no-private', async () => {
    const testDir = await initFixture('independent');

    await new VersionCommand(createArgv(testDir, '--bump', 'patch', '--no-private'));

    const message = await getCommitMessage(testDir);
    // TODO: (major) make --no-private the default
    expect(message).not.toContain('package-5');
  });
});
