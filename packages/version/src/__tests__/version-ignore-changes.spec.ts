import nodeFs from 'node:fs';
import { dirname, join, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// test command
import type { VersionCommandOption } from '@lerna-lite/core';
import { gitAdd, gitCommit, gitTag, initFixtureFactory, showCommit } from '@lerna-test/helpers';
// stabilize commit SHA
import gitSHA from '@lerna-test/helpers/serializers/serialize-git-sha.js';
import { outputFile } from 'fs-extra/esm';
import { describe, expect, it, vi } from 'vitest';
import yargParser from 'yargs-parser';
import { VersionCommand } from '../version-command.js';

vi.spyOn(nodeFs, 'renameSync');

// local modules _must_ be explicitly mocked
vi.mock('../lib/git-push', async () => vi.importActual('../lib/__mocks__/git-push'));
vi.mock('../lib/is-anything-committed', async () => vi.importActual('../lib/__mocks__/is-anything-committed'));
vi.mock('../lib/is-behind-upstream', async () => vi.importActual('../lib/__mocks__/is-behind-upstream'));
vi.mock('../lib/remote-branch-exists', async () => vi.importActual('../lib/__mocks__/remote-branch-exists'));

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

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFixture = initFixtureFactory(pathResolve(__dirname, '../../../publish/src/__tests__'));

expect.addSnapshotSerializer(gitSHA);

expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: [{ key: 'ignoreChanges' }] });
  argv['$0'] = cwd;
  return argv as unknown as VersionCommandOption;
};

describe('version --ignore-changes', () => {
  const setupChanges = async (cwd: string, tuples: [string, string][]) => {
    await gitTag(cwd, 'v1.0.0');
    await Promise.all(tuples.map(([filePath, content]) => outputFile(join(cwd, filePath), content, 'utf8')));
    await gitAdd(cwd, '.');
    await gitCommit(cwd, 'setup');
  };

  it('does not version packages with ignored changes', async () => {
    const cwd = await initFixture('normal');

    await setupChanges(cwd, [
      ['packages/package-2/README.md', 'oh'],
      ['packages/package-3/__tests__/pkg3.test.js', 'hai'],
      ['packages/package-4/lib/foo.js', 'there'],
    ]);

    // await lernaVersion(cwd)(
    await new VersionCommand(
      createArgv(
        cwd,
        '--ignore-changes',
        'README.md',

        '--ignore-changes',
        '**/__tests__/**',

        '--ignore-changes',
        'package-4' // notably does NOT work, needs to be "**/package-4/**" to match
      )
    );

    const changedFiles = await showCommit(cwd, '--name-only');
    expect(changedFiles).toMatchSnapshot();
  });
});
