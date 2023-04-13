import { describe, expect, it, Mock, test, vi } from 'vitest';

vi.mock('load-json-file', async () => await vi.importActual('../lib/__mocks__/load-json-file'));
vi.mock('@lerna-lite/core', async () => {
  const { exec, execSync } = await vi.importActual<any>('@lerna-lite/core');
  return {
    ...(await vi.importActual<any>('@lerna-lite/core')),
    exec: vi.fn(exec),
    execSync: vi.fn(execSync),
  };
});

import npmlog from 'npmlog';
import { pathExistsSync, readJsonSync } from 'fs-extra/esm';
import { promises as fsPromises } from 'node:fs';
import { dirname as pathDirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Package } from '@lerna-lite/core';

// mocked or stubbed modules
import { loadJsonFile } from 'load-json-file';

// helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);
import { exec, execSync, Project } from '@lerna-lite/core';
import { initFixtureFactory } from '@lerna-test/helpers';
const initFixture = initFixtureFactory(__dirname);

import {
  loadPackageLockFileWhenExists,
  updateClassicLockfileVersion,
  updateTempModernLockfileVersion,
  saveUpdatedLockJsonFile,
  runInstallLockFileOnly,
  validateFileExists,
} from '../lib/update-lockfile-version';

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
        await updateTempModernLockfileVersion(pkg as unknown as Package, lockFileOutput!.json);
      }
      await saveUpdatedLockJsonFile(lockFileOutput!.path, lockFileOutput!.json);
    }

    // expect(Array.from((loadJsonFile as any).registry.keys())).toStrictEqual(['/packages/package-1', '/packages/package-2', '/']);
    expect(readJsonSync(rootLockFilePath)).toMatchSnapshot();
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

describe('run install lockfile-only', () => {
  describe('npm client', () => {
    it(`should update project root lockfile by calling npm script "npm install --package-lock-only" when npm version is >= 8.5.0`, async () => {
      (execSync as any).mockReturnValueOnce('8.5.0');
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('npm', cwd, []);

      expect(execSync).toHaveBeenCalledWith('npm', ['--version']);
      expect(exec).toHaveBeenCalledWith('npm', ['install', '--package-lock-only'], { cwd });
      expect(lockFileOutput).toBe('package-lock.json');
    });

    it(`should display a log error when npm version is below 8.5.0 and not actually sync anything`, async () => {
      (execSync as any).mockReturnValueOnce('8.4.0');
      const cwd = await initFixture('lockfile-version2');
      const logSpy = vi.spyOn(npmlog, 'error');

      await runInstallLockFileOnly('npm', cwd, []);

      expect(execSync).toHaveBeenCalledWith('npm', ['--version']);
      expect(logSpy).toHaveBeenCalledWith(
        'lock',
        expect.stringContaining('your npm version is lower than 8.5.0 which is the minimum requirement to use `--sync-workspace-lock`')
      );
    });

    it(`should update project root lockfile by calling npm script "npm install --package-lock-only" with extra npm client arguments when provided`, async () => {
      (execSync as any).mockReturnValueOnce('8.5.0');
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('npm', cwd, ['--legacy-peer-deps']);

      expect(execSync).toHaveBeenCalledWith('npm', ['--version']);
      expect(exec).toHaveBeenCalledWith('npm', ['install', '--package-lock-only', '--legacy-peer-deps'], { cwd });
      expect(lockFileOutput).toBe('package-lock.json');
    });

    it(`should update project root lockfile by calling npm script "npm install --legacy-peer-deps,--force" with multiple npm client arguments provided as CSV`, async () => {
      (execSync as any).mockReturnValueOnce('8.5.0');
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('npm', cwd, ['--legacy-peer-deps,--force']);

      expect(execSync).toHaveBeenCalledWith('npm', ['--version']);
      expect(exec).toHaveBeenCalledWith('npm', ['install', '--package-lock-only', '--legacy-peer-deps', '--force'], {
        cwd,
      });
      expect(lockFileOutput).toBe('package-lock.json');
    });
  });

  describe('pnpm client', () => {
    it('should log an error when lockfile is not located under project root', async () => {
      const logSpy = vi.spyOn(npmlog, 'error');
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('pnpm', cwd, []);

      expect(logSpy).toHaveBeenCalledWith(
        'lock',
        expect.stringContaining(`we could not sync neither locate "pnpm-lock.yaml" by using "pnpm" client at location ${cwd}`)
      );
      expect(lockFileOutput).toBe(undefined);
    });

    it(`should update project root lockfile by calling client script "pnpm install --package-lock-only"`, async () => {
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (exec as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('pnpm', cwd, []);

      expect(exec).toHaveBeenCalledWith('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], { cwd });
      expect(lockFileOutput).toBe('pnpm-lock.yaml');
    });

    it(`should update project root lockfile by calling client script "pnpm install --package-lock-only" with extra npm client arguments when provided`, async () => {
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (exec as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('pnpm', cwd, ['--frozen-lockfile']);

      expect(exec).toHaveBeenCalled();
      expect(exec).toHaveBeenCalledWith('pnpm', ['install', '--lockfile-only', '--ignore-scripts', '--frozen-lockfile'], { cwd });
      expect(lockFileOutput).toBe('pnpm-lock.yaml');
    });
  });

  describe('yarn client', () => {
    it(`should NOT update project root lockfile when yarn version is 1.0.0 and is below 2.0.0`, async () => {
      (execSync as any).mockReturnValueOnce('1.0.0');
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (exec as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      await runInstallLockFileOnly('yarn', cwd, []);

      expect(execSync).toHaveBeenCalledWith('yarn', ['--version']);
      expect(exec).not.toHaveBeenCalled();
    });

    it(`should update project root lockfile by calling client script "yarn install --package-lock-only"`, async () => {
      (execSync as any).mockReturnValueOnce('3.0.0');
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (exec as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('yarn', cwd, []);

      expect(execSync).toHaveBeenCalledWith('yarn', ['--version']);
      expect(exec).toHaveBeenCalledWith('yarn', ['install', '--mode', 'update-lockfile'], { cwd });
      expect(lockFileOutput).toBe('yarn.lock');
    });

    it(`should update project root lockfile by calling client script "yarn install --package-lock-only" with extra npm client arguments when provided`, async () => {
      (execSync as any).mockReturnValueOnce('4.0.0');
      vi.spyOn(fsPromises, 'access').mockResolvedValue(true as any);
      (exec as Mock).mockImplementationOnce(() => true);
      const cwd = await initFixture('lockfile-version2');

      const lockFileOutput = await runInstallLockFileOnly('yarn', cwd, ['--check-files']);

      expect(execSync).toHaveBeenCalledWith('yarn', ['--version']);
      expect(exec).toHaveBeenCalledWith('yarn', ['install', '--mode', 'update-lockfile', '--check-files'], { cwd });
      expect(lockFileOutput).toBe('yarn.lock');
    });
  });
});
