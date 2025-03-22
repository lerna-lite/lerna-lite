import { beforeAll, describe, expect, Mock, test, vi } from 'vitest';

vi.mock('write-package', async () => await vi.importActual('../../../version/src/lib/__mocks__/write-package'));

// mocked modules of @lerna-lite/core
// vi.fn()
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('../../../core/src/index')),
  describeRef: vi.fn((await vi.importActual<any>('../../../core/src/utils/describe-ref')).describeRef),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  promptSelectOne: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptSelectOne,
  promptTextInput: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptTextInput,
  throwIfUncommitted: (await vi.importActual<any>('../../../core/src/__mocks__/check-working-tree')).throwIfUncommitted,
}));

// also point to the local publish command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/publish', async () => await vi.importActual('../publish-command'));

vi.mock('../lib/get-packages-without-license', async () => await vi.importActual('../lib/__mocks__/get-packages-without-license'));
vi.mock('../lib/verify-npm-package-access', async () => await vi.importActual('../lib/__mocks__/verify-npm-package-access'));
vi.mock('../lib/get-npm-username', async () => await vi.importActual('../lib/__mocks__/get-npm-username'));
vi.mock('../lib/get-two-factor-auth-required', async () => await vi.importActual('../lib/__mocks__/get-two-factor-auth-required'));
vi.mock('../lib/npm-publish', async () => await vi.importActual('../lib/__mocks__/npm-publish'));
import { outputFile } from 'fs-extra/esm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yargParser from 'yargs-parser';

// mocked modules
import * as writePkg from 'write-package';
import { npmPublish } from '../lib/npm-publish.js';
import { npmPublish as npmPublishMock } from '../lib/__mocks__/npm-publish.js';
import { promptConfirmation, PublishCommandOption, describeRef, throwIfUncommitted } from '@lerna-lite/core';

// helpers
import { commandRunner, gitAdd, gitTag, gitCommit, initFixtureFactory, loggingOutput } from '@lerna-test/helpers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(__dirname);

// test command
import { factory, PublishCommand } from '../index.js';
import cliCommands from '../../../cli/src/cli-commands/cli-publish-commands.js';
const lernaPublish = commandRunner(cliCommands);

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

// stabilize commit SHA
import gitSHA from '@lerna-test/helpers/serializers/serialize-git-sha.js';
expect.addSnapshotSerializer(gitSHA);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('publish');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.join(' ');
  const argv = yargParser(parserArgs);
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  argv.composed = 'composed';
  return argv as unknown as PublishCommandOption;
};

async function initTaggedFixture(fixtureName, tagVersionPrefix = 'v') {
  const cwd = await initFixture(fixtureName);

  if (fixtureName.indexOf('independent') > -1) {
    await Promise.all([
      gitTag(cwd, 'package-1@1.0.0'),
      gitTag(cwd, 'package-2@2.0.0'),
      gitTag(cwd, 'package-3@3.0.0'),
      gitTag(cwd, 'package-4@4.0.0'),
      gitTag(cwd, 'package-5@5.0.0'),
    ]);
  } else {
    await gitTag(cwd, `${tagVersionPrefix}1.0.0`);
  }

  return cwd;
}

/**
 * ALL canary tests _require_ an actual commit _past_ the original tag,
 * as a canary release on the same commit as a tagged release is non-sensical.
 *
 * @param {String} cwd Current working directory
 * @param {Array[String]..} tuples Any number of [filePath, fileContent] configs
 */
async function setupChanges(cwd, ...tuples) {
  await Promise.all(tuples.map(([filePath, content]) => outputFile(join(cwd, filePath), content, 'utf8')));
  await gitAdd(cwd, '.');
  await gitCommit(cwd, 'setup');
}

test('publish --canary', async () => {
  const cwd = await initTaggedFixture('normal');

  await setupChanges(cwd, ['packages/package-1/all-your-base.js', 'belong to us'], ['packages/package-4/non-matching-semver.js', 'senpai noticed me']);
  await new PublishCommand(createArgv(cwd, '--canary'));

  expect(promptConfirmation).toHaveBeenLastCalledWith('Are you sure you want to publish these packages?');
  expect((npmPublish as typeof npmPublishMock).registry).toEqual(
    new Map([
      ['package-1', 'canary'],
      ['package-4', 'canary'],
      ['package-2', 'canary'],
      ['package-3', 'canary'],
    ])
  );
  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-alpha.0+SHA,
      "package-2": 1.0.1-alpha.0+SHA,
      "package-3": 1.0.1-alpha.0+SHA,
      "package-4": 1.0.1-alpha.0+SHA,
    }
  `);
});

test('publish --canary with auto-confirm --yes', async () => {
  const cwd = await initTaggedFixture('normal');

  await setupChanges(cwd, ['packages/package-1/all-your-base.js', 'belong to us'], ['packages/package-4/non-matching-semver.js', 'senpai noticed me']);
  await new PublishCommand(createArgv(cwd, '--canary', '--yes'));

  expect(promptConfirmation).not.toHaveBeenCalled();
  expect((npmPublish as typeof npmPublishMock).registry).toEqual(
    new Map([
      ['package-1', 'canary'],
      ['package-4', 'canary'],
      ['package-2', 'canary'],
      ['package-3', 'canary'],
    ])
  );
  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-alpha.0+SHA,
      "package-2": 1.0.1-alpha.0+SHA,
      "package-3": 1.0.1-alpha.0+SHA,
      "package-4": 1.0.1-alpha.0+SHA,
    }
  `);
});

test('publish --canary --preid beta', async () => {
  const cwd = await initTaggedFixture('normal');

  await setupChanges(cwd, ['packages/package-1/all-your-base.js', 'belong to us']);
  // await new PublishCommand(createArgv(cwd, '--canary', '--preid', 'beta'));
  await factory(createArgv(cwd, '--canary', '--preid', 'beta'));

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-beta.0+SHA,
      "package-2": 1.0.1-beta.0+SHA,
      "package-3": 1.0.1-beta.0+SHA,
    }
  `);
});

test("publish --canary --tag-version-prefix='abc'", async () => {
  const cwd = await initTaggedFixture('normal', 'abc');

  await setupChanges(cwd, ['packages/package-1/all-your-base.js', 'belong to us']);
  await new PublishCommand(createArgv(cwd, '--canary', '--tag-version-prefix', 'abc'));

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-alpha.0+SHA,
      "package-2": 1.0.1-alpha.0+SHA,
      "package-3": 1.0.1-alpha.0+SHA,
      "package-4": 1.0.1-alpha.0+SHA,
    }
  `);
});

test('publish --canary <semver>', async () => {
  const cwd = await initTaggedFixture('normal');

  await setupChanges(cwd, ['packages/package-1/all-your-base.js', 'belong to us']);
  await new PublishCommand(createArgv(cwd, '--canary', 'prerelease'));
  // prerelease === prepatch, which is the default

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-alpha.0+SHA,
      "package-2": 1.0.1-alpha.0+SHA,
      "package-3": 1.0.1-alpha.0+SHA,
    }
  `);
});

test('publish --canary --independent', async () => {
  const cwd = await initTaggedFixture('independent');

  await setupChanges(cwd, ['packages/package-1/all-your-base.js', 'belong to us']);
  await new PublishCommand(createArgv(cwd, '--canary', '--bump', 'preminor'));

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.1.0-alpha.0+SHA,
      "package-2": 2.1.0-alpha.0+SHA,
      "package-3": 3.1.0-alpha.0+SHA,
    }
  `);
});

test('publish --canary addresses unpublished package', async () => {
  const cwd = await initTaggedFixture('independent');

  await setupChanges(
    cwd,
    [
      'packages/package-6/package.json',
      JSON.stringify({
        name: 'package-6',
        // npm init starts at 1.0.0,
        // but an unpublished 1.0.0 should be 1.0.0-alpha.0, n'est-ce pas?
        version: '0.1.0',
      }),
    ],
    ['packages/package-6/new-kids.js', 'on the block']
  );
  await new PublishCommand(createArgv(cwd, '--canary', '--bump', 'premajor'));

  // there have been two commits since the beginning of the repo
  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-6": 1.0.0-alpha.1+SHA,
    }
  `);
});

describe('publish --canary differential', () => {
  test('source', async () => {
    const cwd = await initTaggedFixture('snake-graph');

    await setupChanges(cwd, ['packages/package-1/all-your-base.js', 'belong to us']);
    await new PublishCommand(createArgv(cwd, '--canary', 'patch'));

    expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
      {
        "package-1": 1.0.1-alpha.0+SHA,
        "package-2": 1.0.1-alpha.0+SHA,
        "package-3": 1.0.1-alpha.0+SHA,
        "package-4": 1.0.1-alpha.0+SHA,
        "package-5": 1.0.1-alpha.0+SHA,
      }
    `);
  });

  test('internal', async () => {
    const cwd = await initTaggedFixture('snake-graph');

    await setupChanges(cwd, ['packages/package-3/malcolm.js', 'in the middle']);
    await new PublishCommand(createArgv(cwd, '--canary', '--bump', 'minor'));

    expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
      {
        "package-3": 1.1.0-alpha.0+SHA,
        "package-4": 1.1.0-alpha.0+SHA,
        "package-5": 1.1.0-alpha.0+SHA,
      }
    `);
  });

  test('pendant', async () => {
    const cwd = await initTaggedFixture('snake-graph');

    await setupChanges(cwd, ['packages/package-5/celine-dion.js', 'all by myself']);
    await new PublishCommand(createArgv(cwd, '--canary', '--bump', 'major'));

    expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
      {
        "package-5": 2.0.0-alpha.0+SHA,
      }
    `);
  });
});

describe('publish --canary sequential', () => {
  let cwd;

  beforeAll(async () => {
    cwd = await initTaggedFixture('snake-independent');
  });

  test('1. pendant', async () => {
    await setupChanges(cwd, ['packages/package-5/celine-dion.js', 'all by myself']);
    await new PublishCommand(createArgv(cwd, '--canary'));

    expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
      {
        "package-5": 5.0.1-alpha.0+SHA,
      }
    `);
  });

  test('2. internal', async () => {
    await setupChanges(cwd, ['packages/package-3/malcolm.js', 'in the middle']);
    await new PublishCommand(createArgv(cwd, '--canary'));

    expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
      {
        "package-3": 3.0.1-alpha.1+SHA,
        "package-4": 4.0.1-alpha.1+SHA,
        "package-5": 5.0.1-alpha.1+SHA,
      }
    `);
  });

  test('3. source', async () => {
    await setupChanges(cwd, ['packages/package-1/all-your-base.js', 'belong to us']);
    await new PublishCommand(createArgv(cwd, '--canary'));

    expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
      {
        "package-1": 1.0.1-alpha.2+SHA,
        "package-2": 2.0.1-alpha.2+SHA,
        "package-3": 3.0.1-alpha.2+SHA,
        "package-4": 4.0.1-alpha.2+SHA,
        "package-5": 5.0.1-alpha.2+SHA,
      }
    `);
  });

  test('4. internal', async () => {
    await setupChanges(cwd, ['packages/package-3/malcolm.js', 'tucker']);
    await new PublishCommand(createArgv(cwd, '--canary'));

    expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
      {
        "package-3": 3.0.1-alpha.3+SHA,
        "package-4": 4.0.1-alpha.3+SHA,
        "package-5": 5.0.1-alpha.3+SHA,
      }
    `);
  });

  test('5. pendant', async () => {
    await setupChanges(cwd, ['packages/package-5/celine-dion.js', 'my heart will go on']);
    await new PublishCommand(createArgv(cwd, '--canary'));

    expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
      {
        "package-5": 5.0.1-alpha.4+SHA,
      }
    `);
  });
});

test('publish --canary on tagged release exits early', async () => {
  const cwd = await initTaggedFixture('normal');

  await new PublishCommand(createArgv(cwd, '--canary'));

  const logMessages = loggingOutput('success');
  expect(logMessages).toContain('Current HEAD is already released, skipping change detection.');
  expect(logMessages).toContain('No changed packages to publish');
});

test('publish --canary --force-publish on tagged release avoids early exit', async () => {
  const cwd = await initTaggedFixture('normal');

  await new PublishCommand(createArgv(cwd, '--canary', '--force-publish'));

  const logMessages = loggingOutput('warn');
  expect(logMessages).toContain('all packages');
  // lerna WARN force-publish all packages

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-alpha.0+SHA,
      "package-2": 1.0.1-alpha.0+SHA,
      "package-3": 1.0.1-alpha.0+SHA,
      "package-4": 1.0.1-alpha.0+SHA,
    }
  `);
});

test('publish --canary --force-publish <arg> on tagged release avoids early exit', async () => {
  const cwd = await initTaggedFixture('independent');

  // canary committish needs to have a parent, but still tagged on same revision
  await setupChanges(cwd, ['packages/package-5/arbitrary.js', 'change']);
  await gitTag(cwd, 'package-5@5.0.1');

  // there are no _actual_ changes to package-2 or any of its dependencies
  await new PublishCommand(createArgv(cwd, '--canary', '--force-publish', 'package-2'));

  const logMessages = loggingOutput('warn');
  expect(logMessages).toContain('package-2');
  // lerna WARN force-publish package-2

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-2": 2.0.1-alpha.0+SHA,
      "package-3": 3.0.1-alpha.0+SHA,
    }
  `);
});

test('publish --canary with dirty tree throws error', async () => {
  (throwIfUncommitted as Mock).mockImplementationOnce(() => {
    throw new Error('uncommitted');
  });

  const cwd = await initTaggedFixture('normal');
  const command = lernaPublish(cwd)('--canary');

  await expect(command).rejects.toThrow('uncommitted');
  // notably different than the actual message, but good enough here
});

test('publish --canary --git-head <sha> throws an error', async () => {
  const cwd = await initFixture('normal');
  const command = new PublishCommand(createArgv(cwd, '--canary', '--git-head', 'deadbeef'));

  await expect(command).rejects.toThrow(
    expect.objectContaining({
      prefix: 'EGITHEAD',
    })
  );
});

test('publish --canary --include-merged-tags calls git describe correctly', async () => {
  const cwd = await initTaggedFixture('normal');

  await new PublishCommand(createArgv(cwd, '--canary', '--include-merged-tags'));

  expect(describeRef).toHaveBeenCalledWith({ match: 'v*.*.*', cwd }, true);
});

test('publish --canary without _any_ tags', async () => {
  const cwd = await initFixture('normal');
  await lernaPublish(cwd)('--canary');

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-alpha.0+SHA,
      "package-2": 1.0.1-alpha.0+SHA,
      "package-3": 1.0.1-alpha.0+SHA,
      "package-4": 1.0.1-alpha.0+SHA,
    }
  `);
});

test('publish --canary without _any_ tags (independent)', async () => {
  const cwd = await initFixture('independent');
  await new PublishCommand(createArgv(cwd, '--canary'));

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-alpha.0+SHA,
      "package-2": 2.0.1-alpha.0+SHA,
      "package-3": 3.0.1-alpha.0+SHA,
      "package-4": 4.0.1-alpha.0+SHA,
      "package-6": 0.1.1-alpha.0+SHA,
    }
  `);
});

test('publish --canary --no-private', async () => {
  // mostly to say, "yay you didn't explode!"
  // publish always skips private packages already
  const cwd = await initTaggedFixture('independent');
  await setupChanges(
    cwd,
    ['packages/package-1/all-your-base.js', 'belong to us'],
    [
      'packages/package-3/package.json',
      JSON.stringify({
        name: 'package-3',
        version: '3.0.0',
        private: true,
      }),
    ]
  );

  await new PublishCommand(createArgv(cwd, '--canary', '--no-private'));

  expect((writePkg as any).updatedVersions()).toMatchInlineSnapshot(`
    {
      "package-1": 1.0.1-alpha.0+SHA,
      "package-2": 2.0.1-alpha.0+SHA,
    }
  `);
});

test('publish throws error when --build-metadata and --canary are both applied', async () => {
  const cwd = await initFixture('independent');
  await expect(() => lernaPublish(cwd)('--build-metadata', '001', '--canary')).rejects.toThrow(
    expect.objectContaining({
      name: 'ValidationError',
      message: 'Cannot use --build-metadata in conjunction with --canary option.',
    })
  );
});
