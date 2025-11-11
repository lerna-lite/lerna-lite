import dedent from 'dedent';
import globParent from 'glob-parent';
import JSON5 from 'json5';
import { lilconfigSync } from 'lilconfig';
import { loadJsonFile, loadJsonFileSync } from 'load-json-file';
import { writeFileSync } from 'node:fs';
import { basename, dirname, join, normalize, resolve as pathResolve } from 'node:path';
import pMap from 'p-map';
import { globSync } from 'tinyglobby';
import { writeJsonFile } from 'write-json-file';

import { log } from '@lerna-lite/npmlog';

import type { ProjectConfig, RawManifest } from '../models/interfaces.js';

import { Package } from '../package.js';
import { looselyJsonParse } from '../utils/object-utils.js';
import { ValidationError } from '../validation-error.js';
import { applyExtends } from './lib/apply-extends.js';
import { makeFileFinder, makeSyncFileFinder } from './lib/make-file-finder.js';

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
    let loaded;
    try {
      const explorer = lilconfigSync('lerna', {
        searchPlaces: ['package.json', 'lerna.json', 'lerna.jsonc', 'lerna.json5'],
        loaders: {
          '.json': this.json5Loader.bind(this),
          '.jsonc': this.json5Loader.bind(this),
          '.json5': this.json5Loader.bind(this),
        },
      });
      loaded = explorer.search(cwd);
    } catch (err: any) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err.name === 'JSONError' || err.name === 'SyntaxError') {
        throw new ValidationError('JSONError', err.message);
      }
      // re-throw other errors, could be ours or third-party
      throw err;
    }

    let configObj = loaded?.config;
    let configNotFound = !loaded;
    const filepath = loaded?.filepath ?? pathResolve(cwd || '.', 'lerna.json');

    if (configObj) {
      configObj = applyExtends(configObj, dirname(filepath));
      configNotFound = false;
    } else {
      configObj = {};
      configNotFound = true;
    }

    this.config = configObj;
    this.configNotFound = configNotFound;
    this.rootConfigLocation = filepath;
    this.rootPath = dirname(filepath);

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
      /* v8 ignore if */
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
      const search = globSync(Project.LICENSE_GLOB, {
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
      /* v8 ignore next */
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
    /* v8 ignore if */
    if (!/.*lerna\.json[c|5]?$/gi.test(filepath)) {
      // For other .json files, use the default JSON.parse
      return JSON.parse(content);
    }

    /**
     * This prevents lerna from blowing up on trailing commas and comments in lerna configs,
     * however it should be noted that we will not be able to respect those things whenever
     * we perform an automated config migration, e.g. via `lerna repair` and they will be lost.
     * (Although that will be easy enough for the user to see and updated in their `git diff`)
     */
    return looselyJsonParse(content, filepath);
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
