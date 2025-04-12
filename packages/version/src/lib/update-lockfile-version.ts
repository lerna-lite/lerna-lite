import type { Package } from '@lerna-lite/core';
import { execPackageManager, execPackageManagerSync } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { loadJsonFile } from 'load-json-file';
import { promises } from 'node:fs';
import { EOL } from 'node:os';
import { join } from 'node:path';
import semver from 'semver';
import { writeJsonFile } from 'write-json-file';

/**
 * From a folder path provided, try to load a `package-lock.json` file if it exists.
 * @param {String} lockFileFolderPath
 * @returns Promise<{path: string; json: Object; lockFileVersion: number; }>
 */
export async function loadPackageLockFileWhenExists<T = any>(lockFileFolderPath: string) {
  try {
    const lockFilePath = join(lockFileFolderPath, 'package-lock.json');
    const pkgLockFileObj = await loadJsonFile<T>(lockFilePath);
    const lockfileVersion = +(pkgLockFileObj?.['lockfileVersion'] ?? 1);

    return {
      path: lockFilePath,
      json: pkgLockFileObj,
      lockfileVersion,
    };
  } catch (error) {} // eslint-disable-line
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
    const lockFilePath = join(pkg.location, 'package-lock.json');
    const pkgLockFileObj: any = await loadJsonFile(lockFilePath);

    if (pkgLockFileObj) {
      pkgLockFileObj.version = pkg.version;

      // update version for a npm lockfile v2 format
      if (pkgLockFileObj.packages?.['']) {
        pkgLockFileObj.packages[''].version = pkg.version;
        if (pkgLockFileObj.packages[''].dependencies) {
          pkgLockFileObj.packages[''].dependencies = pkg.dependencies;
        }
        if (pkgLockFileObj.packages[''].devDependencies) {
          pkgLockFileObj.packages[''].devDependencies = pkg.devDependencies;
        }
      }

      await writeJsonFile(lockFilePath, pkgLockFileObj, {
        detectIndent: true,
        indent: 2,
      });
      return lockFilePath;
    }
  } catch (error) {} // eslint-disable-line
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
  } catch (error) {} // eslint-disable-line
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
          const [_, versionPrefix, _versionStr] = obj[k].match(/^([\^~])?(.*)$/) || [];
          obj[k] = `${versionPrefix}${newVersion}`;
        } else if (k === 'name' && obj[k] === pkgName && obj['version'] !== undefined) {
          // e.g. "packages/version": { "name": "@lerna-lite/version", "version": "0.1.2" }
          obj['version'] = newVersion;
        }
      }
    }
  }
}

/**
 * Run `npm install --package-lock-only` or equivalent depending on the package manager defined in `npmClient`
 * @param {'npm' | 'pnpm' | 'yarn'} npmClient
 * @param {String} cwd
 * @returns {Promise<string | undefined>} lockfile name if executed successfully
 */
export async function runInstallLockFileOnly(
  npmClient: 'npm' | 'pnpm' | 'yarn',
  cwd: string,
  options: {
    npmClientArgs: string[];
    runScriptsOnLockfileUpdate?: boolean;
  }
): Promise<string | undefined> {
  let inputLockfileName = '';
  let outputLockfileName: string | undefined;
  const npmClientArgsRaw = options.npmClientArgs || [];
  const npmClientArgs: string[] = npmClientArgsRaw.reduce((args, arg) => args.concat(arg.split(/\s|,/)), [] as string[]);

  switch (npmClient) {
    case 'pnpm':
      inputLockfileName = 'pnpm-lock.yaml';
      if (await validateFileExists(join(cwd, inputLockfileName))) {
        log.verbose('lock', `updating lock file via "pnpm install --lockfile-only --ignore-scripts"`);
        await execPackageManager('pnpm', ['install', '--lockfile-only', '--ignore-scripts', ...npmClientArgs], { cwd });
        outputLockfileName = inputLockfileName;
      }
      break;
    case 'yarn':
      inputLockfileName = 'yarn.lock';
      const yarnVersion = execPackageManagerSync('yarn', ['--version']);
      if (semver.gte(yarnVersion, '2.0.0') && (await validateFileExists(join(cwd, inputLockfileName)))) {
        log.verbose('lock', `updating lock file via "yarn install --mode update-lockfile"`);
        await execPackageManager('yarn', ['install', '--mode', 'update-lockfile', ...npmClientArgs], {
          cwd,
          env: {
            ...process.env,
            YARN_ENABLE_SCRIPTS: 'false',
          },
        });
        outputLockfileName = inputLockfileName;
      }
      break;
    case 'npm':
    default:
      inputLockfileName = 'package-lock.json';
      if (await validateFileExists(join(cwd, inputLockfileName))) {
        const localNpmVersion = execPackageManagerSync('npm', ['--version']);
        log.silly(`npm`, `current local npm version is "${localNpmVersion}"`);

        // with npm version >=8.5.0, we can simply call "npm install --package-lock-only"
        if (semver.gte(localNpmVersion, '8.5.0')) {
          log.verbose('lock', `updating lock file via "npm install --package-lock-only"`);
          await execPackageManager(
            'npm',
            [
              'install',
              '--package-lock-only',
              !options.runScriptsOnLockfileUpdate ? '--ignore-scripts' : '',
              ...npmClientArgs,
            ].filter(Boolean),
            { cwd }
          );
        } else {
          log.error(
            'lock',
            'your npm version is lower than 8.5.0 which is the minimum requirement to use `--sync-workspace-lock`'
          );
        }

        outputLockfileName = inputLockfileName;
      }
      break;
  }

  if (!outputLockfileName) {
    log.error(
      'lock',
      [
        `we could not sync neither locate "${inputLockfileName}" by using "${npmClient}" client at location ${cwd}`,
        `Note: if you were expecting a different lock file name, make sure to configure "npmClient" into your "lerna.json" config file.`,
      ].join(EOL)
    );
  }
  return outputLockfileName;
}

/**
 * Simply validates if a file exists
 * @param {String} filePath - file path
 * @returns {Boolean}
 */
export async function validateFileExists(filePath: string) {
  try {
    await promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
