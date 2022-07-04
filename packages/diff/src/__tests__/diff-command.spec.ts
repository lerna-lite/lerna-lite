import execa from 'execa';
import fs from 'fs-extra';
import path from 'path';

jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  collectUpdates: jest.requireActual('../../../core/src/__mocks__/collect-updates').collectUpdates,
  getPackages: jest.requireActual('../../../core/src/project').getPackages,
}));

// mocked modules
let coreChildProcess = require('@lerna-lite/core');

// helpers
const initFixture = require('@lerna-test/init-fixture')(__dirname);
const { getPackages } = require('@lerna-lite/core');
import { gitAdd } from '@lerna-test/git-add';
import { gitCommit } from '@lerna-test/git-commit';
import { gitInit } from '@lerna-test/git-init';
import { gitTag } from '@lerna-test/git-tag';

// file under test
const lernaDiff = require('@lerna-test/command-runner')(require('../../../cli/src/cli-commands/cli-diff-commands'));
import { DiffCommand } from '../index';
import { factory } from '../diff-command';

// file under test
const yargParser = require('yargs-parser');

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('diff');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--pkgName=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: [{ key: 'ignoreChanges' }] });
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv;
};

// stabilize commit SHA
expect.addSnapshotSerializer(require('@lerna-test/serialize-git-sha'));

describe('Diff Command', () => {
  // overwrite spawn so we get piped stdout, not inherited
  coreChildProcess.spawn = jest.fn((...args) => {
    // @ts-ignore
    return execa(...args);
  });

  it('should diff packages from the first commit from DiffCommand class', async () => {
    const cwd = await initFixture('basic');
    const [pkg1] = await getPackages(cwd);
    const rootReadme = path.join(cwd, 'README.md');

    await pkg1.set('changed', 1).serialize();
    await fs.outputFile(rootReadme, 'change outside packages glob');
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'changed');

    // @ts-ignore
    const { stdout } = await new DiffCommand(createArgv(cwd, ''));
    expect(stdout).toMatchSnapshot();
  });

  it('should diff packages from the first commit from factory', async () => {
    const cwd = await initFixture('basic');
    const [pkg1] = await getPackages(cwd);
    const rootReadme = path.join(cwd, 'README.md');

    await pkg1.set('changed', 1).serialize();
    await fs.outputFile(rootReadme, 'change outside packages glob');
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'changed');

    // @ts-ignore
    const { stdout } = await factory(createArgv(cwd, ''));
    expect(stdout).toMatchSnapshot();
  });

  it('should diff packages from the first commit', async () => {
    const cwd = await initFixture('basic');
    const [pkg1] = await getPackages(cwd);
    const rootReadme = path.join(cwd, 'README.md');

    await pkg1.set('changed', 1).serialize();
    await fs.outputFile(rootReadme, 'change outside packages glob');
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'changed');

    // @ts-ignore
    const { stdout } = await new DiffCommand(createArgv(cwd, ''));
    expect(stdout).toMatchSnapshot();
  });

  it('should diff packages from the most recent tag', async () => {
    const cwd = await initFixture('basic');
    const [pkg1] = await getPackages(cwd);

    await pkg1.set('changed', 1).serialize();
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'changed');
    await gitTag(cwd, 'v1.0.1');

    await pkg1.set('sinceLastTag', true).serialize();
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'changed');

    const { stdout } = await lernaDiff(cwd)();
    expect(stdout).toMatchSnapshot();
  });

  it('should diff a specific package', async () => {
    const cwd = await initFixture('basic');
    const [pkg1, pkg2] = await getPackages(cwd);

    await pkg1.set('changed', 1).serialize();
    await pkg2.set('changed', 1).serialize();
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'changed');

    // @ts-ignore
    const { stdout } = await new DiffCommand(createArgv(cwd, 'package-2'));
    expect(stdout).toMatchSnapshot();
  });

  it('passes diff exclude globs configured with --ignore-changes', async () => {
    const cwd = await initFixture('basic');
    const [pkg1] = await getPackages(cwd);

    await pkg1.set('changed', 1).serialize();
    await fs.outputFile(path.join(pkg1.location, 'README.md'), 'ignored change');
    await gitAdd(cwd, '-A');
    await gitCommit(cwd, 'changed');

    // @ts-ignore
    const { stdout } = await new DiffCommand(createArgv(cwd, '--ignore-changes', '**/README.md'));
    expect(stdout).toMatchSnapshot();
  });

  it("should error when attempting to diff a package that doesn't exist from CLI", async () => {
    const cwd = await initFixture('basic');
    const command = lernaDiff(cwd)('missing');

    await expect(command).rejects.toThrow("Cannot diff, the package 'missing' does not exist.");
  });

  it("should error when attempting to diff a package that doesn't exist from DiffCommand class", async () => {
    const cwd = await initFixture('basic');
    const command = new DiffCommand(createArgv(cwd, 'missing'));

    await expect(command).rejects.toThrow("Cannot diff, the package 'missing' does not exist.");
  });

  it('should error when running in a repository without commits', async () => {
    const cwd = await initFixture('basic');

    await fs.remove(path.join(cwd, '.git'));
    await gitInit(cwd);

    const command = new DiffCommand(createArgv(cwd, 'package-1'));
    await expect(command).rejects.toThrow('Cannot diff, there are no commits in this repository yet.');
  });

  it('should error when git diff exits non-zero', async () => {
    const cwd = await initFixture('basic');

    coreChildProcess.spawn.mockImplementationOnce(() => {
      const nonZero = new Error('An actual non-zero, not git diff pager SIGPIPE');
      (nonZero as any).exitCode = 1;

      throw nonZero;
    });

    const command = new DiffCommand(createArgv(cwd, 'package-1'));
    await expect(command).rejects.toThrow('An actual non-zero, not git diff pager SIGPIPE');
  });
});
