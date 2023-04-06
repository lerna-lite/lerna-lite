import { expect, test, vi } from 'vitest';

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

import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargParser from 'yargs-parser';

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { getCommitMessage, initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(pathResolve(__dirname, '../../../publish/src/__tests__'));

// test command
import { VersionCommand } from '../version-command';

// stabilize commit SHA
import gitSHA from '@lerna-test/helpers/serializers/serialize-git-sha';
import { VersionCommandOption } from '@lerna-lite/core';
expect.addSnapshotSerializer(gitSHA);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  return argv as unknown as VersionCommandOption;
};

test('publish --message %s', async () => {
  const cwd = await initFixture('normal');
  // await lernaVersion(cwd)("--message", "chore: Release %s :rocket:");
  await new VersionCommand(createArgv(cwd, '--message', 'chore: Release %s :rocket:'));

  const message = await getCommitMessage(cwd);
  expect(message).toMatch('chore: Release v1.0.1 :rocket:');
});

test('publish --message %v', async () => {
  const cwd = await initFixture('normal');
  // await lernaVersion(cwd)("--message", "chore: Version %v without prefix");
  await new VersionCommand(createArgv(cwd, '--message', 'chore: Version %v without prefix'));

  const message = await getCommitMessage(cwd);
  expect(message).toMatch('chore: Version 1.0.1 without prefix');
});

test('publish -m --independent', async () => {
  const cwd = await initFixture('independent');
  // await lernaVersion(cwd)("-m", "chore: Custom publish message subject");
  await new VersionCommand(createArgv(cwd, '--message', 'chore: Custom publish message subject'));

  const message = await getCommitMessage(cwd);
  expect(message).toMatch('chore: Custom publish message subject');
});
