import { outputFile } from 'fs-extra/esm';
import { dirname, join, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-ignore
import Tacks from 'tacks';
import { expect, test, vi, type Mock } from 'vitest';
import yargParser from 'yargs-parser';

import { promptSelectOne, promptTextInput, type VersionCommandOption } from '@lerna-lite/core';
import {
  commandRunner,
  getCommitMessage,
  gitAdd,
  gitCommit,
  gitInit,
  gitTag,
  initFixtureFactory,
  showCommit,
  temporaryDirectory,
} from '@lerna-test/helpers';
import serializeChangelog from '@lerna-test/helpers/serializers/serialize-changelog.js';

import cliCommands from '../../../cli/src/cli-commands/cli-version-commands.js';
import { VersionCommand } from '../version-command.js';

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
vi.mock('@lerna-lite/version', async () => await vi.importActual('../version-command'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(pathResolve(__dirname, '../../../publish/src/__tests__'));

const { File, Dir } = Tacks;

const lernaVersion = commandRunner(cliCommands);

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === 'string';
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

expect.addSnapshotSerializer(serializeChangelog);

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

const setupChanges = async (cwd: string) => {
  await gitTag(cwd, 'v1.0.1-beta.3');
  await outputFile(join(cwd, 'packages/package-3/hello.js'), 'world');
  await gitAdd(cwd, '.');
  await gitCommit(cwd, 'feat: setup');
};

test('version patch with previous prerelease also graduates prereleased', async () => {
  const testDir = await initFixture('republish-prereleased');
  // should republish 3, 4, and 5 because:
  // package 3 changed
  // package 5 has a prerelease version
  // package 4 depends on package 5

  await setupChanges(testDir);
  await new VersionCommand(createArgv(testDir, '--bump', 'patch'));

  const patch = await showCommit(testDir);
  expect(patch).toMatchSnapshot();
});

test('version prerelease with previous prerelease bumps changed only', async () => {
  const testDir = await initFixture('republish-prereleased');
  // should republish only package 3, because only it changed

  await setupChanges(testDir);
  await new VersionCommand(createArgv(testDir, '--bump', 'prerelease'));

  const patch = await showCommit(testDir);
  expect(patch).toMatchSnapshot();
});

test('version prerelease with previous prerelease supersedes --conventional-commits', async () => {
  const testDir = await initFixture('republish-prereleased');
  // version bump should stay prepatch --preid beta because ---conventional-commits is ignored

  await setupChanges(testDir);
  await new VersionCommand(createArgv(testDir, '--bump', 'prerelease', '--conventional-commits'));

  const patch = await showCommit(testDir);
  expect(patch).toMatchSnapshot();
});

test('version prerelease with existing preid bumps with the preid provide as argument', async () => {
  const testDir = await initFixture('republish-prereleased');
  // Version bump should have the new rc preid
  await setupChanges(testDir);
  await new VersionCommand(createArgv(testDir, '--bump', 'prerelease', '--preid', 'rc'));

  const message = await getCommitMessage(testDir);
  expect(message).toBe('v1.0.1-rc.0');
});

test('version prerelease with immediate graduation', async () => {
  const testDir = await initFixture('republish-prereleased');

  await setupChanges(testDir);
  await new VersionCommand(createArgv(testDir, '--bump', 'prerelease', '--force-publish', 'package-4'));
  // package-4 had no changes, but should still be included for some mysterious reason

  const firstDiff = await showCommit(testDir);
  expect(firstDiff).toMatchSnapshot();

  // no changes, but force everything because the previous prerelease passed QA
  await new VersionCommand(createArgv(testDir, '--bump', 'patch', '--force-publish'));

  const secondDiff = await showCommit(testDir);
  expect(secondDiff).toMatchSnapshot();
});

test('independent version prerelease does not bump on every unrelated change', async () => {
  const cwd = temporaryDirectory();
  const fixture = new Tacks(
    Dir({
      'lerna.json': File({
        version: 'independent',
      }),
      'package.json': File({
        name: 'unrelated-bumps',
      }),
      packages: Dir({
        'pkg-a': Dir({
          'package.json': File({
            name: 'pkg-a',
            version: '1.0.0',
          }),
        }),
        'pkg-b': Dir({
          'package.json': File({
            name: 'pkg-b',
            version: '1.0.0-bumps.1',
            // TODO: (major) make --no-private the default
            private: true,
          }),
        }),
      }),
    })
  );

  fixture.create(cwd);

  await gitInit(cwd, '.');
  await gitAdd(cwd, '-A');
  await gitCommit(cwd, 'init');

  // simulate choices for pkg-a then pkg-b
  (promptSelectOne as any).chooseBump('patch');
  (promptSelectOne as any).chooseBump('PRERELEASE');
  (promptTextInput as Mock).mockImplementationOnce((msg, cfg) =>
    // the _existing_ "bumps" prerelease ID should be preserved
    Promise.resolve(cfg.filter())
  );

  await lernaVersion(cwd)();

  const first = await getCommitMessage(cwd);
  expect(first).toMatchInlineSnapshot(`
chore: Publish new release

 - pkg-a@1.0.1
 - pkg-b@1.0.0-bumps.2
`);

  await outputFile(join(cwd, 'packages/pkg-a/hello.js'), 'world');
  await gitAdd(cwd, '.');
  await gitCommit(cwd, 'feat: hello world');

  // all of this just to say...
  await lernaVersion(cwd)();

  const second = await getCommitMessage(cwd);
  expect(second).toMatchInlineSnapshot(`
  chore: Publish new release

   - pkg-a@1.0.2
  `);
});

test('independent version prerelease respects --no-private', async () => {
  const cwd = temporaryDirectory();
  const fixture = new Tacks(
    Dir({
      'lerna.json': File({
        version: 'independent',
      }),
      'package.json': File({
        name: 'no-private-versioning',
      }),
      packages: Dir({
        'pkg-1': Dir({
          'package.json': File({
            name: 'pkg-1',
            version: '1.0.0',
            devDependencies: {
              'pkg-2': '^2.0.0',
            },
          }),
        }),
        'pkg-2': Dir({
          'package.json': File({
            name: 'pkg-2',
            version: '2.0.0',
            private: true,
          }),
        }),
      }),
    })
  );
  fixture.create(cwd);

  await gitInit(cwd, '.');
  await gitAdd(cwd, '-A');
  await gitCommit(cwd, 'init');

  // TODO: (major) make --no-private the default
  await lernaVersion(cwd)('prerelease', '--no-private');

  const changedFiles = await showCommit(cwd, '--name-only');
  expect(changedFiles).toMatchInlineSnapshot(`
    chore: Publish new release

     - pkg-1@1.0.1-alpha.0

    HEAD -> main, tag: pkg-1@1.0.1-alpha.0

    packages/pkg-1/package.json
  `);
});
