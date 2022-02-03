import path from 'path';
import loadJsonFile from 'load-json-file';
import writeJsonFile from 'write-json-file';
import { Package, Project } from '@ws-conventional-version-roller/core';

/**
 * Update NPM Lock File (when found), the lock file might be version 1 (exist in package folder) or version 2 (exist in workspace root)
 * Depending on the version type, the structure of the lock file will be different and will be updated accordingly
 * @param {Object} pkg
 * @param {Object} project
 * @returns Promise
 */
export async function updateLockfileVersion(pkg: Package, project: Project): Promise<string | null> {
  try {
    // "lockfileVersion" = 1, package lock file might be located in the package folder
    const lockFilePath = path.join(pkg.location, 'package-lock.json');
    const pkgLockFileObj: any = await loadJsonFile(lockFilePath);

    if (pkgLockFileObj) {
      pkgLockFileObj.version = pkg.version;
      await writeJsonFile(lockFilePath, pkgLockFileObj, {
        detectIndent: true,
        indent: 2,
      });
      return lockFilePath;
    }
  } catch (error) { } // eslint-disable-line

  try {
    // OR "lockfileVersion" >= 2, will have a global package lock file located in the root folder and is formatted
    const projFilePath = path.join(project.rootPath, 'package-lock.json');
    const projLockFileObj: any = await loadJsonFile(projFilePath);

    if (projLockFileObj) {
      updateNpmLockFileVersion2(projLockFileObj, pkg.name, pkg.version);
      await writeJsonFile(projFilePath, projLockFileObj, {
        detectIndent: true,
        indent: 2,
      });
      return projFilePath;
    }
  } catch (error) {
    return null;
  }
  return null;
}

/**
 * Update workspace root NPM Lock File Version Type 2
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
          // e.g.: "@ws-conventional-version-roller/core": "^0.1.2",
          const [_, versionPrefix, _versionStr] = obj[k].match(/^([\^~])?(.*)$/);
          obj[k] = `${versionPrefix}${newVersion}`;
        } else if (k === 'name' && obj[k] === pkgName && obj['version'] !== undefined) {
          // e.g. "packages/version": { "name": "@ws-conventional-version-roller/version", "version": "0.1.2" }
          if (obj['version'] !== undefined) {
            obj['version'] = newVersion;
          }
        }
      }
    }
  }
}
