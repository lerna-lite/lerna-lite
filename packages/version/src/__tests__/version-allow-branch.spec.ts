import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { VersionCommandOption } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
import gitSHA from '@lerna-test/helpers/serializers/serialize-git-sha.js';
import { execa } from 'execa';
import { describe, expect, it, vi } from 'vitest';
import yargParser from 'yargs-parser';

import { VersionCommand } from '../index.js';

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

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFixture = initFixtureFactory(pathResolve(__dirname, '../../../publish/src/__tests__'));

expect.addSnapshotSerializer(gitSHA);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('version');
  if (args.length > 0 && args[1]?.length > 0 && !args[1].startsWith('-')) {
    args[1] = `--bump=${args[1]}`;
  }
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: args });
  argv['$0'] = cwd;
  return argv as unknown as VersionCommandOption;
};

describe('version --allow-branch', () => {
  const changeBranch = (cwd: string, name: string) => execa('git', ['checkout', '-B', name], { cwd });

  describe('cli', () => {
    it('rejects a non matching branch', async () => {
      const testDir = await initFixture('normal');

      await changeBranch(testDir, 'unmatched');
      const command = new VersionCommand(createArgv(testDir, '--allow-branch', 'main'));

      await expect(command).rejects.toThrow(`Branch "unmatched" is restricted from versioning`);
    });

    it('accepts an exactly matching branch', async () => {
      const testDir = await initFixture('normal');

      await changeBranch(testDir, 'exact-match');
      const result = await new VersionCommand(createArgv(testDir, '--allow-branch', 'exact-match'));

      expect((result as any).updates).toHaveLength(5);
    });

    it('accepts a branch that matches by wildcard', async () => {
      const testDir = await initFixture('normal');

      await changeBranch(testDir, 'feature/awesome');
      const result = await new VersionCommand(createArgv(testDir, '--allow-branch', 'feature/*'));

      expect((result as any).updates).toHaveLength(5);
    });

    it('accepts a branch that matches one of the items passed', async () => {
      const testDir = await initFixture('normal');

      await changeBranch(testDir, 'feature/awesome');
      const result = await new VersionCommand(createArgv(testDir, '--allow-branch', 'main', 'feature/*'));

      expect((result as any).updates).toHaveLength(5);
    });
  });

  describe('lerna.json', () => {
    it('rejects a non matching branch', async () => {
      const testDir = await initFixture('allow-branch-lerna');

      await changeBranch(testDir, 'unmatched');
      const command = new VersionCommand(createArgv(testDir));

      await expect(command).rejects.toThrow(`Branch "unmatched" is restricted from versioning`);
    });

    it('accepts a matching branch', async () => {
      const testDir = await initFixture('allow-branch-lerna');

      await changeBranch(testDir, 'lerna');
      const result = await new VersionCommand(createArgv(testDir));

      expect((result as any).updates).toHaveLength(1);
    });

    it('should prioritize cli over defaults', async () => {
      const testDir = await initFixture('allow-branch-lerna');

      await changeBranch(testDir, 'cli-override');
      const result = await new VersionCommand(createArgv(testDir, '--allow-branch', 'cli-override'));

      expect((result as any).updates).toHaveLength(1);
    });
  });
});