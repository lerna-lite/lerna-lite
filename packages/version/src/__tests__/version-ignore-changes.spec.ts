import nodeFs from 'fs';
jest.spyOn(nodeFs, 'renameSync');

// local modules _must_ be explicitly mocked
jest.mock('../lib/git-push', () => jest.requireActual('../lib/__mocks__/git-push'));
jest.mock('../lib/is-anything-committed', () => jest.requireActual('../lib/__mocks__/is-anything-committed'));
jest.mock('../lib/is-behind-upstream', () => jest.requireActual('../lib/__mocks__/is-behind-upstream'));
jest.mock('../lib/remote-branch-exists', () => jest.requireActual('../lib/__mocks__/remote-branch-exists'));

// mocked modules of @lerna-lite/core
jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
  promptConfirmation: jest.requireActual('../../../core/src/__mocks__/prompt').promptConfirmation,
  promptSelectOne: jest.requireActual('../../../core/src/__mocks__/prompt').promptSelectOne,
  promptTextInput: jest.requireActual('../../../core/src/__mocks__/prompt').promptTextInput,
  throwIfUncommitted: jest.requireActual('../../../core/src/__mocks__/check-working-tree').throwIfUncommitted,
}));

import fs from 'fs-extra';
import path from 'path';
import yargParser from 'yargs-parser';

// helpers
import { gitAdd } from '@lerna-test/helpers';
import { gitCommit } from '@lerna-test/helpers';
import { gitTag } from '@lerna-test/helpers';
import { showCommit } from '@lerna-test/helpers';
import helpers from '@lerna-test/helpers';
const initFixture = helpers.initFixtureFactory(path.resolve(__dirname, '../../../publish/src/__tests__'));

// test command
import { VersionCommand } from '../version-command';

// stabilize commit SHA
expect.addSnapshotSerializer(require('@lerna-test/helpers/serializers/serialize-git-sha'));

const createArgv = (cwd, ...args) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: [{ key: 'ignoreChanges' }] });
  argv['$0'] = cwd;
  return argv;
};

describe('version --ignore-changes', () => {
  const setupChanges = async (cwd, tuples) => {
    await gitTag(cwd, 'v1.0.0');
    await Promise.all(tuples.map(([filePath, content]) => fs.outputFile(path.join(cwd, filePath), content, 'utf8')));
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
