import path from 'path';
import loadJsonFile from 'load-json-file';
import writeJsonFile from 'write-json-file';
import { Package } from '@lerna-lite/core';

/**
 * From a folder path provided, try to load a `package-lock.json` file if it exists.
 * @param {String} lockFileFolderPath
 * @returns Promise<{path: string; json: Object; lockFileVersion: number; }>
 */
export async function loadPackageLockFileWhenExists<T = any>(lockFileFolderPath: string) {
  try {
    const lockFilePath = path.join(lockFileFolderPath, 'package-lock.json');
    const pkgLockFileObj = await loadJsonFile<T>(lockFilePath);
    const lockfileVersion = +(pkgLockFileObj?.['lockfileVersion'] ?? 1);

    return {
      path: lockFilePath,
      json: pkgLockFileObj,
      lockfileVersion
    };
  } catch (error) { } // eslint-disable-line
}

/**
 * Update NPM Lock File (when found), the lock file might be version 1 (exist in package folder) or version 2 (exist in workspace root)
 * Depending on the version type, the structure of the lock file will be different and will be updated accordingly
 * @param {Object} pkg
 * @param {Object} project
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
  } catch (error) { } // eslint-disable-line
}

/**
 * Update NPM Lock File (when found), the lock file must be version 2 or higher and is considered as modern lockfile,
 * its structure is different and all version properties will be updated accordingly
 * @param {Object} pkg
 * @param {Object} project
 * @returns Promise<string>
 */
export function updateTempModernLockfileVersion(pkg: Package, projLockFileObj: any) {
  // OR "lockfileVersion" >= 2 in the project root, will have a global package lock file located in the root folder and is formatted
  if (projLockFileObj) {
    updateNpmLockFileVersion2(projLockFileObj, pkg.name, pkg.version);
  }
}

/**
 * Save a lockfile by providing a full path and an updated json object
 * @param {String} filePath
 * @param {Object} updateLockFileObj
 * @returns Promise<String | undefined> - file path will be returned when it was found and updated
 */
export async function saveUpdatedLockJsonFile(filePath: string, updateLockFileObj: any): Promise<string | undefined> {
  try {
    await writeJsonFile(filePath, updateLockFileObj, {
      detectIndent: true,
      indent: 2,
    });
    return filePath;
  } catch (error) { } // eslint-disable-line
}

/**
 * Update workspace root NPM Lock File Version Type 2 (considerd modern lockfile)
 * @param {Object} obj
 * @param {String} pkgName
 * @param {String} newVersion
 */
export function updateNpmLockFileVersion2(obj: any, pkgName: string, newVersion: string) {
  if (typeof obj === 'object' && pkgName && newVersion) {
    for (const k in obj) {
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        updateNpmLockFileVersion2(obj[k], pkgName, newVersion);
      } else {
        if (k === pkgName) {
          // e.g.: "@lerna-lite/core": "^0.1.2",
          const [_, versionPrefix, _versionStr] = obj[k].match(/^([\^~])?(.*)$/);
          obj[k] = `${versionPrefix}${newVersion}`;
        } else if (k === 'name' && obj[k] === pkgName && obj['version'] !== undefined) {
          // e.g. "packages/version": { "name": "@lerna-lite/version", "version": "0.1.2" }
          if (obj['version'] !== undefined) {
            obj['version'] = newVersion;
          }
        }
      }
    }
  }
}
