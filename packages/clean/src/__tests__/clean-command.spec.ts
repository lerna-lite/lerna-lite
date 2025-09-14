import { describe, expect, it, Mock, vi } from 'vitest';

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  promptConfirmation: (await vi.importActual<any>('../../../core/src/__mocks__/prompt')).promptConfirmation,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  PackageGraph: (await vi.importActual<any>('../../../core/src/package-graph/package-graph')).PackageGraph,
  getPackages: (await vi.importActual<any>('../../../core/src/project/project')).getPackages,
}));

// also point to the local version command so that all mocks are properly used even by the command-runner
vi.mock('../lib/remove-dir.js', async () => ({
  removeDir: vi.fn(),
}));

// mocked modules
import { dirname, join, resolve } from 'node:path';
// helpers
import { fileURLToPath } from 'node:url';

import { type CleanCommandOption, promptConfirmation } from '@lerna-lite/core';
import { initFixtureFactory, normalizeRelativeDir } from '@lerna-test/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initFixture = initFixtureFactory(resolve(__dirname, '../../../clean/src/__tests__'));

// assertion helpers
import { removeDir } from '../lib/remove-dir.js';
const removedDirectories = (testDir: string) => (removeDir as any).mock.calls.map(([directory]: string[]) => normalizeRelativeDir(testDir, directory));

// file under test
import yargParser from 'yargs-parser';

import { CleanCommand } from '../index.js';

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('clean');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: [{ key: 'ignoreChanges' }] });
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv as unknown as CleanCommandOption;
};

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

// normalize temp directory paths in snapshots
import serializeTempdir from '@lerna-test/helpers/serializers/serialize-tempdir.js';
import { remove } from 'fs-extra/esm';
expect.addSnapshotSerializer(serializeTempdir);

describe('Clean Command', () => {
  describe('basic tests', () => {
    it('should rm -rf the node_modules', async () => {
      const testDir = await initFixture('basic');

      await new CleanCommand(createArgv(testDir, ''));

      expect(promptConfirmation).toHaveBeenCalled();
      expect(removedDirectories(testDir)).toEqual(['packages/package-1/node_modules', 'packages/package-2/node_modules', 'packages/package-3/node_modules']);
    });

    it('exits early when confirmation is rejected', async () => {
      const testDir = await initFixture('basic');

      (promptConfirmation as Mock).mockResolvedValueOnce(false);

      await new CleanCommand(createArgv(testDir, ''));

      expect(removedDirectories(testDir)).toEqual([]);
    });

    it('should be possible to skip asking for confirmation', async () => {
      const testDir = await initFixture('basic');

      await new CleanCommand(createArgv(testDir, '--yes'));

      expect(promptConfirmation).not.toHaveBeenCalled();
    });

    it('should only clean scoped packages', async () => {
      const testDir = await initFixture('basic');

      await new CleanCommand(createArgv(testDir, '--scope', 'package-1'));

      expect(removedDirectories(testDir)).toEqual(['packages/package-1/node_modules']);
    });

    it('should not clean ignored packages', async () => {
      const testDir = await initFixture('basic');

      await new CleanCommand(createArgv(testDir, '--ignore', 'package-2', '--ignore', '@test/package-3'));

      expect(removedDirectories(testDir)).toEqual(['packages/package-1/node_modules']);
    });

    it('exits non-zero when rimraf errors egregiously', async () => {
      (removeDir as Mock).mockImplementationOnce(() => Promise.reject(new Error('whoops')));

      const testDir = await initFixture('basic');
      const command = new CleanCommand(createArgv(testDir, ''));

      await expect(command).rejects.toThrow('whoops');
    });

    it('requires a git repo when using --since', async () => {
      const testDir = await initFixture('basic');

      await remove(join(testDir, '.git'));

      const command = new CleanCommand(createArgv(testDir, '--since', 'some-branch'));
      await expect(command).rejects.toThrow('this is not a git repository');
    });
  });
});
