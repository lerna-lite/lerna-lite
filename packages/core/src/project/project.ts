import { cosmiconfigSync, defaultLoaders, type PublicExplorerSync } from 'cosmiconfig';
import dedent from 'dedent';
import { globbySync } from 'globby';
import globParent from 'glob-parent';
import JSON5 from 'json5';
import log from 'npmlog';
import { writeFileSync } from 'node:fs';
import { basename, dirname, join, normalize, resolve as pathResolve } from 'node:path';
import pMap from 'p-map';
import { loadJsonFile, loadJsonFileSync } from 'load-json-file';
import { writeJsonFile } from 'write-json-file';

import { Package } from '../package.js';
import { applyExtends } from './lib/apply-extends.js';
import { ValidationError } from '../validation-error.js';
import { makeFileFinder, makeSyncFileFinder } from './lib/make-file-finder.js';
import { ProjectConfig, RawManifest } from '../models/index.js';

/**
 * A representation of the entire project managed by Lerna.
 *
 * Wherever the lerna.json file is located, that is the project root.
 * All package globs are rooted from this location.
 */
export class Project {
  config: ProjectConfig;
  configNotFound: boolean;
  rootConfigLocation: string;
  rootPath: string;
  static PACKAGE_GLOB = 'packages/*';
  static LICENSE_GLOB = 'LICEN{S,C}E{,.*}';

  /**
   * @param {string} [cwd] Defaults to process.cwd()
   */
  constructor(cwd?: string) {
    let explorer: PublicExplorerSync;
    try {
      explorer = cosmiconfigSync('lerna', {
        loaders: {
          ...defaultLoaders,
          '.json': this.json5Loader,
          '.jsonc': this.json5Loader,
          '.json5': this.json5Loader,
        },
        searchPlaces: ['lerna.json', 'lerna.jsonc', 'lerna.json5', 'package.json'],
        transform(obj) {
          // cosmiconfig returns null when nothing is found
          if (!obj) {
            return {
              // No need to distinguish between missing and empty,
              // saves a lot of noisy guards elsewhere
              config: {},
              configNotFound: true,
              // pathResolve(".", ...) starts from process.cwd()
              filepath: pathResolve(cwd || '.', 'lerna.json'),
            };
          }

          obj.config = applyExtends(obj.config, dirname(obj.filepath));

          return obj;
        },
      });
    } catch (err: any) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err.name === 'JSONError') {
        throw new ValidationError(err.name, err.message);
      }

      // re-throw other errors, could be ours or third-party
      /* c8 ignore next */
      throw err;
    }

    let loaded;

    try {
      loaded = explorer.search(cwd);
    } catch (err: any) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err.name === 'JSONError') {
        throw new ValidationError(err.name, err.message);
      }

      // re-throw other errors, could be ours or third-party
      throw err;
    }

    this.config = loaded?.config;
    this.configNotFound = loaded?.configNotFound;
    this.rootConfigLocation = loaded?.filepath ?? '';
    this.rootPath = dirname(loaded?.filepath ?? '');

    log.verbose('rootPath', this.rootPath);
  }

  /**
   * @param {string} [cwd] Defaults to process.cwd()
   */
  static getPackages(cwd: string): Promise<Package[]> {
    return new Project(cwd).getPackages();
  }

  /**
   * @param {string} [cwd] Defaults to process.cwd()
   */
  static getPackagesSync(cwd: string) {
    return new Project(cwd).getPackagesSync();
  }

  get version(): string {
    return this.config.version;
  }

  set version(val: string) {
    this.config.version = val;
  }

  get packageConfigs() {
    if (this.config.useWorkspaces) {
      const workspaces = this.manifest?.get('workspaces');

      if (!workspaces) {
        throw new ValidationError(
          'EWORKSPACES',
          dedent`
            Yarn workspaces need to be defined in the root package.json.
            See: https://github.com/lerna/lerna/blob/master/commands/bootstrap/README.md#--use-workspaces
          `
        );
      }

      const workspaceList = ((workspaces as { packages?: string[] }).packages || workspaces) as string[];
      log.verbose('project workspaces packages', workspaceList.join(' '));
      return workspaceList;
    }

    log.verbose('project packages', (this.config.packages || [Project.PACKAGE_GLOB]).join(' '));
    return this.config.packages || [Project.PACKAGE_GLOB];
  }

  get packageParentDirs(): string[] {
    return (this.packageConfigs as any).map(globParent).map((parentDir: string) => pathResolve(this.rootPath, parentDir));
  }

  get manifest(): RawManifest {
    let manifest;

    try {
      const manifestLocation = join(this.rootPath, 'package.json');
      const packageJson = loadJsonFileSync(manifestLocation) as RawManifest;

      if (!packageJson.name) {
        // npm-lifecycle chokes if this is missing, so default like npm init does
        packageJson.name = basename(dirname(manifestLocation));
      }

      // Encapsulate raw JSON in Package instance
      manifest = new Package(packageJson, this.rootPath);

      // redefine getter to lazy-loaded value
      Object.defineProperty(this, 'manifest', {
        value: manifest,
      });
    } catch (err: any) {
      // redecorate JSON syntax errors, avoid debug dump
      /* c8 ignore next 3 */
      if (err.name === 'JSONError') {
        throw new ValidationError(err.name, err.message);
      }

      // try again next time
    }

    return manifest;
  }

  get licensePath(): string {
    let licensePath: string | undefined;

    try {
      const search = globbySync(Project.LICENSE_GLOB, {
        cwd: this.rootPath,
        absolute: true,
        caseSensitiveMatch: false,
        // Project license is always a sibling of the root manifest
        deep: 0,
      });

      licensePath = search.shift();

      if (licensePath) {
        // POSIX results always need to be normalized
        licensePath = normalize(licensePath);

        // redefine getter to lazy-loaded value
        Object.defineProperty(this, 'licensePath', {
          value: licensePath,
        });
      }
    } catch (err: any) {
      /* c8 ignore next */
      throw new ValidationError(err.name, err.message);
    }

    return licensePath as string;
  }

  get fileFinder() {
    const finder = makeFileFinder(this.rootPath, this.packageConfigs);

    // redefine getter to lazy-loaded value
    Object.defineProperty(this, 'fileFinder', {
      value: finder,
    });

    return finder;
  }

  /**
   * @returns {Promise<Package[]>} A promise resolving to a list of Package instances
   */
  getPackages(): Promise<Package[]> {
    const mapper = (packageConfigPath: string) =>
      loadJsonFile(packageConfigPath)?.then(
        (packageJson: any) => new Package(packageJson, dirname(packageConfigPath), this.rootPath)
      );

    return this.fileFinder('package.json', (filePaths: string[]) => pMap(filePaths, mapper, { concurrency: 50 }));
  }

  /**
   * @returns {Package[]} A list of Package instances
   */
  getPackagesSync() {
    return makeSyncFileFinder(this.rootPath, this.packageConfigs)('package.json', (packageConfigPath: string) => {
      return new Package(loadJsonFileSync(packageConfigPath), dirname(packageConfigPath), this.rootPath);
    }) as string[];
  }

  getPackageLicensePaths(): Promise<string[]> {
    return this.fileFinder(Project.LICENSE_GLOB, null, { caseSensitiveMatch: false });
  }

  isIndependent() {
    return this.version === 'independent';
  }

  json5Loader(filepath: string, content: any) {
    /* c8 ignore next 4 */
    if (!/.*lerna\.json[c|5]?$/gi.test(filepath)) {
      // when none of the 3x lerna config file type is found `lerna.{json,jsonc,json5}`, return default cosmiconfig json loader
      return defaultLoaders['.json'](filepath, content);
    }

    /**
     * This prevents lerna from blowing up on trailing commas and comments in lerna configs,
     * however it should be noted that we will not be able to respect those things whenever
     * we perform an automated config migration, e.g. via `lerna repair` and they will be lost.
     * (Although that will be easy enough for the user to see and updated in their `git diff`)
     */
    try {
      return JSON5.parse(content);
    } catch (err: unknown) {
      if (err instanceof Error) {
        err.name = 'JSONError';
        err.message = `Error in: ${filepath}\n${err.message}`;
      }
      throw err;
    }
  }

  serializeConfig(): Promise<string> {
    if (this.rootConfigLocation.endsWith('lerna.json5')) {
      // for .json5, we must use JSON stringify method then save as regular text file
      return new Promise((resolve) => {
        writeFileSync(this.rootConfigLocation, JSON5.stringify(this.config, { space: 2 }));
        resolve(this.rootConfigLocation);
      });
    } else {
      // TODO: might be package.json prop
      // for .json/.jsonc we can use `write-json-file` lib
      return writeJsonFile(this.rootConfigLocation, this.config, { indent: 2, detectIndent: true }).then(
        () => this.rootConfigLocation
      );
    }
  }
}

Project.PACKAGE_GLOB = 'packages/*';
Project.LICENSE_GLOB = 'LICEN{S,C}E{,.*}';
