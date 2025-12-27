import { promises as fsPromises } from 'node:fs';
import { join, dirname as pathDirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';

import type { Package } from '@lerna-lite/core';
import { execPackageManager, execPackageManagerSync, Project } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { initFixtureFactory } from '@lerna-test/helpers';
import { pathExistsSync, readJsonSync } from 'fs-extra/esm';
import { loadJsonFile } from 'load-json-file';
import { beforeEach, describe, expect, it, test, vi, type Mock } from 'vitest';

import {
  loadPackageLockFileWhenExists,
  runInstallLockFileOnly,
  saveUpdatedLockJsonFile,
  updateClassicLockfileVersion,
  updateTempModernLockfileVersion,
  validateFileExists,
} from '../lib/update-lockfile-version.js';

vi.mock('load-json-file', async () => await vi.importActual('../lib/__mocks__/load-json-file'));
vi.mock('@lerna-lite/core', async () => {
  const { execPackageManager, execPackageManagerSync } = await vi.importActual<any>('@lerna-lite/core');
  return {
    ...(await vi.importActual<any>('@lerna-lite/core')),
    execPackageManager: vi.fn(execPackageManager),
    execPackageManagerSync: vi.fn(execPackageManagerSync),
  };
});

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

const initFixture = initFixtureFactory(__dirname);

// Serialize the JSONError output to be more human readable
expect.addSnapshotSerializer({
  serialize(str: string) {
    return stripVTControlCharacters(str).replace(/Error in: .*lerna\.json/, 'Error in: normalized/path/to/lerna.json');
  },
  test(val: string) {
    return val != null && typeof val === 'string' && val.includes('Error in: ');
  },
});

describe('npm classic lock file', () => {
  test('updateLockfileVersion with lockfile v1', async () => {
    const cwd = await initFixture('lockfile-leaf');
    const [pkg] = await Project.getPackages(cwd);

    pkg.version = '2.0.0';

    const returnedLockfilePath = await updateClassicLockfileVersion(pkg as unknown as Package);

    expect(returnedLockfilePath).toBe(join(pkg.location, 'package-lock.json'));
    expect(Array.from((loadJsonFile as any).registry.keys())).toStrictEqual(['/packages/package-1']);
    expect(readJsonSync(returnedLockfilePath as string)).toHaveProperty('version', '2.0.0');
  });

  test('updateClassicLockfileVersion with lockfile v2', async () => {
    const cwd = await initFixture('lockfile-leaf-v2');
    const [pkg] = await Project.getPackages(cwd);

    pkg.version = '2.0.0';
    pkg.dependencies['package-1'] = '^2.0.0';
    pkg.devDependencies['package-2'] = '3.0.0';

    const returnedLockfilePath = await updateClassicLockfileVersion(pkg as unknown as Package);

    const updatedLockfile = readJsonSync(returnedLockfilePath as string);
    expect(returnedLockfilePath).toBe(join(pkg.location, 'package-lock.json'));
    expect(Array.from((loadJsonFile as any).registry.keys())).toStrictEqual(['/packages/package-1']);
    expect(updatedLockfile).toHaveProperty('version', '2.0.0');
    expect(updatedLockfile.packages[''].dependencies['package-1']).toBe('^2.0.0');
    expect(updatedLockfile.packages[''].dependencies['tiny-tarball']).toBe('^1.0.0');
    expect(updatedLockfile.packages[''].devDependencies['package-2']).toBe('3.0.0');
  });

  test('updateClassicLockfileVersion without sibling lockfile', async () => {
    const cwd = await initFixture('lifecycle', false);
    const [pkg] = await Project.getPackages(cwd);

    pkg.version = '1.1.0';

    (loadJsonFile as any).mockImplementationOnce(() => Promise.reject(new Error('file not found')));

    const returnedLockfilePath = await updateClassicLockfileVersion(pkg as unknown as Package);

    expect(returnedLockfilePath).toBeUndefined();
    expect(pathExistsSync(join(pkg.location, 'package-lock.json'))).toBe(false);
  });
});

describe('npm modern lock file', () => {
  test('updateModernLockfileVersion v2 in project root', async () => {
    const mockVersion = '2.4.0';
    const cwd = await initFixture('lockfile-version2');
    const rootLockFilePath = join(cwd, 'package-lock.json');
    const packages = await Project.getPackages(cwd);

    const lockFileOutput = await loadPackageLockFileWhenExists(cwd);
    if (lockFileOutput!.json) {
      for (const pkg of packages) {
        pkg.version = mockVersion;
        updateTempModernLockfileVersion(pkg as unknown as Package, lockFileOutput!.json);
      }
      await saveUpdatedLockJsonFile(lockFileOutput!.path, lockFileOutput!.json);
    }

    // expect(Array.from((loadJsonFile as any).registry.keys())).toStrictEqual(['/packages/package-1', '/packages/package-2', '/']);
    expect(readJsonSync(rootLockFilePath)).toEqual({
      dependencies: {
        '@my-workspace/package-1': {
          requires: { 'tiny-tarball': '^1.0.0' },
          version: 'file:packages/package-1',
        },
        '@my-workspace/package-2': {
          requires: { '@my-workspace/package-1': '^2.4.0' },
          version: 'file:packages/package-2',
        },
      },
      lockfileVersion: 2,
      name: 'my-workspace',
      packages: {
        '': {
          license: 'MIT',
          name: 'my-workspace',
          workspaces: ['./packages/package-1', './packages/package-2'],
        },
        'node_modules/package-1': {
          link: true,
          resolved: 'packages/package-1',
        },
        'node_modules/package-2': {
          link: true,
          resolved: 'packages/package-2',
        },
        'packages/package-1': {
          license: 'MIT',
          name: '@my-workspace/package-1',
          'tiny-tarball': {
            integrity: 'sha1-u/EC1a5zr+LFUyleD7AiMCFvZbE=',
            resolved: 'https://registry.npmjs.org/tiny-tarball/-/tiny-tarball-1.0.0.tgz',
            version: '1.0.0',
          },
          version: '2.4.0',
        },
        'packages/package-2': {
          dependencies: { '@my-workspace/package-1': '^2.4.0' },
          license: 'MIT',
          name: '@my-workspace/package-2',
          version: '2.4.0',
        },
      },
      requires: true,
    });
  });
});

describe('validateFileExists() method', () => {
  it(`should return true when file exist`, async () => {
    const cwd = await initFixture('lockfile-version2');
    const exists = await validateFileExists(join(cwd, 'package-lock.json'));

    expect(exists).toBe(true);
  });

  it(`should return false when file does not exist`, async () => {
    const cwd = await initFixture('lockfile-version2');
    const exists = await validateFileExists(join(cwd, 'wrong-file.json'));

    expect(exists).toBe(false);
  });
});

describe('pnpm client', () => {
  it('should log an error when lockfile is not located under project root', async () => {
    (execPackageManager as Mock).mockImplementationOnce(() => false);
    const logSpy = vi.spyOn(log, 'error');
    const cwd = await initFixture('lockfile-version2');

    const lockFileOutput = await runInstallLockFileOnly('pnpm', cwd, { npmClientArgs: [] });

    expect(logSpy).toHaveBeenCalledWith(
      'lock',
      expect.stringContaining(`we could not sync neither locate "pnpm-lock.yaml" by using "pnpm" client at location ${cwd}`)
    );
    expect(lockFileOutput).toBe(undefined);
  });

  it(`should update project root lockfile by calling client script "pnpm install --package-lock-only"`, async () => {
    vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
    (execPackageManager as Mock).mockImplementationOnce(() => true);
    const cwd = await initFixture('lockfile-version2');

    const lockFileOutput = await runInstallLockFileOnly('pnpm', cwd, { npmClientArgs: [] });

    expect(execPackageManager).toHaveBeenCalledWith('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], { cwd });
    expect(lockFileOutput).toBe('pnpm-lock.yaml');
  });

  it(`should update project root lockfile by calling client script "pnpm install --package-lock-only" with extra npm client arguments when provided`, async () => {
    vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
    (execPackageManager as Mock).mockImplementationOnce(() => true);
    const cwd = await initFixture('lockfile-version2');

    const lockFileOutput = await runInstallLockFileOnly('pnpm', cwd, { npmClientArgs: ['--frozen-lockfile'] });

    expect(execPackageManager).toHaveBeenCalled();
    expect(execPackageManager).toHaveBeenCalledWith(
      'pnpm',
      ['install', '--lockfile-only', '--ignore-scripts', '--frozen-lockfile'],
      { cwd }
    );
    expect(lockFileOutput).toBe('pnpm-lock.yaml');
  });
});

describe('bun client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should log an error when lockfile is not located under project root', async () => {
    (execPackageManager as Mock).mockImplementationOnce(() => false);
    const logSpy = vi.spyOn(log, 'error');
    const cwd = await initFixture('lockfile-version2');

    const lockFileOutput = await runInstallLockFileOnly('bun', cwd, { npmClientArgs: [] });

    expect(logSpy).toHaveBeenCalledWith(
      'lock',
      expect.stringContaining(`we could not sync neither locate "bun.lock" by using "bun" client at location ${cwd}`)
    );
    expect(lockFileOutput).toBe(undefined);
  });

  it(`should update project root lockfile by calling client script "bun install --lockfile-only --ignore-scripts"`, async () => {
    vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
    (execPackageManager as Mock).mockImplementationOnce(() => true);
    const cwd = await initFixture('lockfile-bun');

    const lockFileOutput = await runInstallLockFileOnly('bun', cwd, { npmClientArgs: [] });

    expect(execPackageManager).toHaveBeenCalledWith('bun', ['install', '--lockfile-only', '--ignore-scripts'], { cwd });
    expect(lockFileOutput).toBe('bun.lock');
  });

  it(`should update project root lockfile by calling client script "bun install --lockfile-only --ignore-scripts" with extra npm client arguments when provided`, async () => {
    vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
    (execPackageManager as Mock).mockImplementationOnce(() => true);
    const cwd = await initFixture('lockfile-bun');

    const lockFileOutput = await runInstallLockFileOnly('bun', cwd, { npmClientArgs: ['--frozen-lockfile'] });

    expect(execPackageManager).toHaveBeenCalled();
    expect(execPackageManager).toHaveBeenCalledWith(
      'bun',
      ['install', '--lockfile-only', '--ignore-scripts', '--frozen-lockfile'],
      { cwd }
    );
    expect(lockFileOutput).toBe('bun.lock');
  });
});

describe('run install lockfile-only', () => {
  describe('npm client', () => {
    it(`should update project root lockfile by calling npm script "npm install --package-lock-only --ignore-scripts"`, async () => {
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (execPackageManager as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('npm', cwd, { npmClientArgs: [] });

      expect(execPackageManagerSync).toHaveBeenCalledWith('npm', ['--version']);
      expect(execPackageManager).toHaveBeenCalledWith('npm', ['install', '--package-lock-only', '--ignore-scripts'], { cwd });
      expect(lockFileOutput).toBe('package-lock.json');
    });

    it(`should update project root lockfile by calling npm script "npm install --package-lock-only" without running npm scripts when --run-scripts-on-lockfile-update is enabled`, async () => {
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (execPackageManager as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('npm', cwd, { npmClientArgs: [], runScriptsOnLockfileUpdate: true });

      expect(execPackageManagerSync).toHaveBeenCalledWith('npm', ['--version']);
      expect(execPackageManager).toHaveBeenCalledWith('npm', ['install', '--package-lock-only'], { cwd });
      expect(lockFileOutput).toBe('package-lock.json');
    });

    it(`should update project root lockfile by calling npm script "npm install --package-lock-only" with extra npm client arguments when provided`, async () => {
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (execPackageManager as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('npm', cwd, {
        npmClientArgs: ['--legacy-peer-deps'],
        runScriptsOnLockfileUpdate: false,
      });

      expect(execPackageManagerSync).toHaveBeenCalledWith('npm', ['--version']);
      expect(execPackageManager).toHaveBeenCalledWith(
        'npm',
        ['install', '--package-lock-only', '--ignore-scripts', '--legacy-peer-deps'],
        { cwd }
      );
      expect(lockFileOutput).toBe('package-lock.json');
    });

    it(`should update project root lockfile by calling npm script "npm install --legacy-peer-deps,--force" with multiple npm client arguments provided as CSV`, async () => {
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('npm', cwd, { npmClientArgs: ['--legacy-peer-deps,--force'] });

      expect(execPackageManagerSync).toHaveBeenCalledWith('npm', ['--version']);
      expect(execPackageManager).toHaveBeenCalledWith(
        'npm',
        ['install', '--package-lock-only', '--ignore-scripts', '--legacy-peer-deps', '--force'],
        {
          cwd,
        }
      );
      expect(lockFileOutput).toBe('package-lock.json');
    });
  });

  describe('yarn client', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(`should NOT update project root lockfile when yarn version is 1.0.0 and is below 2.0.0`, async () => {
      (execPackageManagerSync as any).mockReturnValueOnce('1.0.0');
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (execPackageManager as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      await runInstallLockFileOnly('yarn', cwd, { npmClientArgs: [] });

      expect(execPackageManagerSync).toHaveBeenCalledWith('yarn', ['--version']);
      expect(execPackageManager).not.toHaveBeenCalled();
    });

    it(`should update project root lockfile by calling client script "yarn install --package-lock-only"`, async () => {
      (execPackageManagerSync as any).mockReturnValueOnce('3.0.0');
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (execPackageManager as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('yarn', cwd, { npmClientArgs: [] });

      expect(execPackageManagerSync).toHaveBeenCalledWith('yarn', ['--version']);
      expect(execPackageManager).toHaveBeenCalledWith('yarn', ['install', '--mode', 'update-lockfile'], {
        cwd,
        env: {
          ...process.env,
          YARN_ENABLE_SCRIPTS: 'false',
        },
      });
      expect(lockFileOutput).toBe('yarn.lock');
    });

    it(`should update project root lockfile by calling client script "yarn install --package-lock-only" with extra npm client arguments when provided`, async () => {
      (execPackageManagerSync as any).mockReturnValueOnce('4.0.0');
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (execPackageManager as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('yarn', cwd, { npmClientArgs: ['--check-files'] });

      expect(execPackageManagerSync).toHaveBeenCalledWith('yarn', ['--version']);
      expect(execPackageManager).toHaveBeenCalledWith('yarn', ['install', '--mode', 'update-lockfile', '--check-files'], {
        cwd,
        env: {
          ...process.env,
          YARN_ENABLE_SCRIPTS: 'false',
        },
      });
      expect(lockFileOutput).toBe('yarn.lock');
    });
  });
});