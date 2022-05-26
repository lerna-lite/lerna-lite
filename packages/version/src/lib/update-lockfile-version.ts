// eslint-disable-next-line import/no-unresolved
import { PackageLock, LockDependency } from '@npm/types';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import loadJsonFile from 'load-json-file';
import writeJsonFile from 'write-json-file';
import { Package } from '@lerna-lite/core';
import { Lockfile as PnpmLockfile } from '@pnpm/lockfile-types';

export type NpmLockfile = PackageLock & { packages: { [moduleName: string]: LockDependency } };

export type NpmLockfileInformation = {
  json: NpmLockfile;
  path: string;
  version: number;
  packageManager: 'npm';
};

export type PnpmLockfileInformation = {
  json: PnpmLockfile;
  path: string;
  version: number;
  packageManager: 'pnpm';
};

export type LockfileInformation = NpmLockfileInformation | PnpmLockfileInformation;

export const isPnpmLockfile = (x: LockfileInformation): x is PnpmLockfileInformation =>
  x.packageManager === 'pnpm';
export const isNpmLockfile = (x: LockfileInformation): x is NpmLockfileInformation =>
  x.packageManager === 'npm';

async function loadYamlFile<T>(filePath: string) {
  try {
    const file = await fs.promises.readFile(filePath);
    return (await yaml.load(`${file}`)) as T;
  } catch (e) {
    return undefined;
  }
}

async function writeYamlFile(filePath: string, data: unknown) {
  try {
    const str = yaml.dump(data);
    await fs.promises.writeFile(filePath, str);
    // eslint-disable-next-line no-empty
  } catch (e) {}
}

async function loadNpmLockfile(cwd: string): Promise<LockfileInformation | undefined> {
  try {
    const lockfilePath = path.join(cwd, 'package-lock.json');
    const json = await loadJsonFile<NpmLockfile>(lockfilePath);
    const version = +(json?.['lockfileVersion'] ?? 1);

    return {
      json,
      version,
      path: lockfilePath,
      packageManager: 'npm',
    };
  } catch (error) {} // eslint-disable-line
}

async function loadPnpmLockfile(cwd: string): Promise<LockfileInformation | undefined> {
  try {
    const lockfilePath = path.join(cwd, 'pnpm-lock.yaml');
    const json = (await loadYamlFile(lockfilePath)) as PnpmLockfile;
    const version = +(json?.['lockfileVersion'] ?? 1);

    return {
      json,
      version,
      path: lockfilePath,
      packageManager: 'pnpm',
    };
  } catch (error) {} // eslint-disable-line
}

export async function loadLockfile(cwd: string): Promise<LockfileInformation | undefined> {
  let lockFile = await loadNpmLockfile(cwd);
  if (!lockFile) {
    lockFile = await loadPnpmLockfile(cwd);
  }

  return lockFile;
}

/**
 * Update NPM Lock File (when found), the lock file might be version 1 (exist in package folder) or version 2 (exist in workspace root)
 * Depending on the version type, the structure of the lock file will be different and will be updated accordingly
 * @param {Object} pkg
 * @returns Promise<string>
 */
export async function updateClassicLockfileVersion(pkg: Package): Promise<string | undefined> {
  try {
    // "lockfileVersion" = 1, package lock file might be located in the package folder
    const lockFilePath = path.join(pkg.location, 'package-lock.json');
    const pkgLockFileObj: any = await loadJsonFile(lockFilePath);

    if (pkgLockFileObj) {
      pkgLockFileObj.version = pkg.version;

      // update version for a npm lockfile v2 format
      if (pkgLockFileObj.packages?.['']) {
        pkgLockFileObj.packages[''].version = pkg.version;
      }

      await writeJsonFile(lockFilePath, pkgLockFileObj, {
        detectIndent: true,
        indent: 2,
      });
      return lockFilePath;
    }
  } catch (error) {} // eslint-disable-line
}

export function updateTempModernLockfileVersion(pkg: Package, lockfile: LockfileInformation) {
  switch (lockfile.packageManager) {
    case 'pnpm':
      updatePnpmLockFile(lockfile, pkg.name, pkg.version);
      break;
    case 'npm':
      updateNpmLockFileVersion2(lockfile, pkg.name, pkg.version);
      break;
  }
}

export async function saveLockfile(lockfile: LockfileInformation) {
  try {
    switch (lockfile.packageManager) {
      case 'pnpm':
        await writeYamlFile(lockfile.path, lockfile.json);
        break;
      case 'npm':
        await writeJsonFile(lockfile.path, lockfile.json, {
          detectIndent: true,
          indent: 2,
        });
        break;
    }

    return lockfile.path;
  } catch (error) {} // eslint-disable-line
}

export function updateNpmLockFileVersion2(
  lockfile: LockfileInformation,
  pkgName: string,
  newVersion: string
) {
  if (!lockfile.json || !pkgName || !newVersion || !isNpmLockfile(lockfile)) {
    return;
  }

  const updateNpmLockPart = (part: unknown) => {
    if (typeof part !== 'object') {
      return;
    }

    for (const k in part) {
      if (typeof part[k] === 'object' && part[k] !== null) {
        updateNpmLockPart(part[k]);
      } else {
        if (k === pkgName) {
          // e.g.: "@lerna-lite/core": "^0.1.2",
          const [_, versionPrefix, _versionStr] = part[k].match(/^([\^~])?(.*)$/);
          part[k] = `${versionPrefix}${newVersion}`;
        } else if (k === 'name' && part[k] === pkgName && part['version'] !== undefined) {
          // e.g. "packages/version": { "name": "@lerna-lite/version", "version": "0.1.2" }
          if (part['version'] !== undefined) {
            part['version'] = newVersion;
          }
        }
      }
    }
  };
  updateNpmLockPart(lockfile.json);
}

export function updatePnpmLockFile(lockfile: LockfileInformation, pkgName: string, newVersion: string) {
  if (!lockfile.json || !pkgName || !newVersion || !isPnpmLockfile(lockfile)) {
    return;
  }

  const updatePnpmLockPart = (part: unknown) => {
    if (typeof part !== 'object') {
      return;
    }

    for (const k in part) {
      if (k === 'specifiers' && !!part[k][pkgName]) {
        const [_, versionPrefix] = part[k][pkgName].match(/^workspace:([\^~])?(.*)$/);
        part[k][pkgName] = `workspace:${versionPrefix}${newVersion}`;
      } else if (
        typeof part[k] === 'object' &&
        part[k] !== null &&
        part[k] !== undefined &&
        k !== 'specifiers' &&
        k !== 'dependencies'
      ) {
        updatePnpmLockPart(part[k]);
      }
    }
  };

  updatePnpmLockPart(lockfile.json.importers);
}
