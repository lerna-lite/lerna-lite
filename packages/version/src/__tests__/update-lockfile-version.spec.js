'use strict';

const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');

// mocked or stubbed modules
const loadJsonFile = require('load-json-file');

// helpers
const { getPackages } = require('../../../core/src/project');
const initFixture = require('@lerna-test/init-fixture')(__dirname);

const {
  updateClassicLockfileVersion,
  updateTempModernLockfileVersion,
  loadLockfile,
  saveLockfile,
} = require('../lib/update-lockfile-version');

describe('npm classic lock file', () => {
  test('updateLockfileVersion with lockfile v1', async () => {
    const cwd = await initFixture('lockfile-leaf');
    const [pkg] = await getPackages(cwd);

    pkg.version = '2.0.0';

    const returnedLockfilePath = await updateClassicLockfileVersion(pkg);

    expect(returnedLockfilePath).toBe(path.join(pkg.location, 'package-lock.json'));
    expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual(['/packages/package-1']);
    expect(fs.readJSONSync(returnedLockfilePath)).toHaveProperty('version', '2.0.0');
  });

  test('updateClassicLockfileVersion with lockfile v2', async () => {
    const cwd = await initFixture('lockfile-leaf-v2');
    const [pkg] = await getPackages(cwd);

    pkg.version = '2.0.0';

    const returnedLockfilePath = await updateClassicLockfileVersion(pkg);

    expect(returnedLockfilePath).toBe(path.join(pkg.location, 'package-lock.json'));
    expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual(['/packages/package-1']);
    const updatedLockfile = fs.readJSONSync(returnedLockfilePath);
    expect(updatedLockfile).toHaveProperty('version', '2.0.0');
    expect(updatedLockfile).toHaveProperty(['packages', '', 'version'], '2.0.0');
  });

  test('updateClassicLockfileVersion without sibling lockfile', async () => {
    const cwd = await initFixture('lifecycle', false);
    const [pkg] = await getPackages(cwd);

    pkg.version = '1.1.0';

    loadJsonFile.mockImplementationOnce(() => Promise.reject(new Error('file not found')));

    const returnedLockfilePath = await updateClassicLockfileVersion(pkg);

    expect(returnedLockfilePath).toBeUndefined();
    expect(fs.pathExistsSync(path.join(pkg.location, 'package-lock.json'))).toBe(false);
  });
});

describe('npm modern lock file', () => {
  test('call updateNpmLockFileVersion2 for npm lock file in project root', async () => {
    const mockVersion = '2.4.0';
    const cwd = await initFixture('lockfile-version2');
    const rootLockFilePath = path.join(cwd, 'package-lock.json');
    const packages = await getPackages(cwd);

    const lockFileOutput = await loadLockfile(cwd);
    if (lockFileOutput.json) {
      for (const pkg of packages) {
        pkg.version = mockVersion;
        await updateTempModernLockfileVersion(pkg, lockFileOutput);
      }
      await saveLockfile(lockFileOutput);
    }

    expect(lockFileOutput.packageManager).toBe('npm');
    expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual([
      '/packages/package-1',
      '/packages/package-2',
      '/',
    ]);
    expect(fs.readJSONSync(rootLockFilePath)).toMatchSnapshot();
  });
});

describe('pnpm lock file', () => {
  test('call updatePnpmLockFile for pnpm lock file in project root', async () => {
    const mockVersion = '2.5.0';
    const cwd = await initFixture('lockfile-pnpm');
    const packages = await getPackages(cwd);

    // loading lock file should work with/without providing npm client type (2nd arg)
    let lockFileOutput = await loadLockfile(cwd);
    expect(lockFileOutput).not.toBeUndefined();
    expect(lockFileOutput.packageManager).toBe('pnpm');

    lockFileOutput = await loadLockfile(cwd, 'pnpm');
    expect(lockFileOutput).not.toBeUndefined();
    expect(lockFileOutput.packageManager).toBe('pnpm');

    if (lockFileOutput.json) {
      for (const pkg of packages) {
        pkg.version = mockVersion;
        await updateTempModernLockfileVersion(pkg, lockFileOutput);
      }
      await saveLockfile(lockFileOutput);
    }

    expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual([
      '/packages/package-1',
      '/packages/package-2',
      '/packages/package-3',
      '/packages/package-4',
      '/',
    ]);

    expect(`${fs.readFileSync(lockFileOutput.path)}`).toMatchSnapshot();
  });
});
