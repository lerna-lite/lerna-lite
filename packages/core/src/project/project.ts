import { cosmiconfigSync } from 'cosmiconfig';
import dedent from 'dedent';
import globby from 'globby';
import globParent from 'glob-parent';
import log from 'npmlog';
import path from 'path';
import pMap from 'p-map';
import loadJsonFile from 'load-json-file';
import writeJsonFile from 'write-json-file';

import { Package } from '../package';
import { applyExtends } from './lib/apply-extends';
import { ValidationError } from '../validation-error';
import { makeFileFinder, makeSyncFileFinder } from './lib/make-file-finder';

interface ProjectConfig {
  command?: string;
  packages: string[];
  useWorkspaces: boolean;
  version: string;
}

/**
 * A representation of the entire project managed by Lerna.
 *
 * Wherever the lerna.json file is located, that is the project root.
 * All package globs are rooted from this location.
 */
export class Project {
  config: ProjectConfig;
  rootConfigLocation: string;
  rootPath: string;
  static PACKAGE_GLOB = 'packages/*';
  static LICENSE_GLOB = 'LICEN{S,C}E{,.*}';

  /**
   * @param {string} [cwd] Defaults to process.cwd()
   */
  constructor(cwd: string) {
    const explorer = cosmiconfigSync('lerna', {
      searchPlaces: ['lerna.json', 'package.json'],
      transform(obj) {
        // cosmiconfig returns null when nothing is found
        if (!obj) {
          return {
            // No need to distinguish between missing and empty,
            // saves a lot of noisy guards elsewhere
            config: {},
            // path.resolve(".", ...) starts from process.cwd()
            filepath: path.resolve(cwd || '.', 'lerna.json'),
          };
        }

        obj.config = applyExtends(obj.config, path.dirname(obj.filepath));

        return obj;
      },
    });

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
    this.rootConfigLocation = loaded?.filepath ?? '';
    this.rootPath = path.dirname(loaded?.filepath ?? '');

    log.verbose('rootPath', this.rootPath);
  }

  /**
   * @param {string} [cwd] Defaults to process.cwd()
   */
  static getPackages(cwd: string) {
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

      log.verbose('project workspaces packages', (workspaces.packages || workspaces).join(' '));
      return workspaces.packages || workspaces;
    }

    log.verbose('project packages', (this.config.packages || [Project.PACKAGE_GLOB]).join(' '));
    return this.config.packages || [Project.PACKAGE_GLOB];
  }

  get packageParentDirs() {
    return this.packageConfigs.map(globParent).map((parentDir: string) => path.resolve(this.rootPath, parentDir));
  }

  get manifest() {
    let manifest;

    try {
      const manifestLocation = path.join(this.rootPath, 'package.json');
      const packageJson = loadJsonFile.sync(manifestLocation) as Package;

      if (!packageJson.name) {
        // npm-lifecycle chokes if this is missing, so default like npm init does
        packageJson.name = path.basename(path.dirname(manifestLocation));
      }

      // Encapsulate raw JSON in Package instance
      manifest = new Package(packageJson, this.rootPath);

      // redefine getter to lazy-loaded value
      Object.defineProperty(this, 'manifest', {
        value: manifest,
      });
    } catch (err: any) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err.name === 'JSONError') {
        throw new ValidationError(err.name, err.message);
      }

      // try again next time
    }

    return manifest;
  }

  get licensePath() {
    let licensePath;

    try {
      const search = globby.sync(Project.LICENSE_GLOB, {
        cwd: this.rootPath,
        absolute: true,
        caseSensitiveMatch: false,
        // Project license is always a sibling of the root manifest
        deep: 0,
      });

      licensePath = search.shift();

      if (licensePath) {
        // POSIX results always need to be normalized
        licensePath = path.normalize(licensePath);

        // redefine getter to lazy-loaded value
        Object.defineProperty(this, 'licensePath', {
          value: licensePath,
        });
      }
    } catch (err: any) {
      /* istanbul ignore next */
      throw new ValidationError(err.name, err.message);
    }

    return licensePath;
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
  getPackages(): Promise<any[]> {
    const mapper = (packageConfigPath: string) =>
      loadJsonFile(packageConfigPath)?.then(
        (packageJson: any) => new Package(packageJson, path.dirname(packageConfigPath), this.rootPath)
      );

    return this.fileFinder('package.json', (filePaths: string[]) => pMap(filePaths, mapper, { concurrency: 50 }));
  }

  /**
   * @returns {Package[]} A list of Package instances
   */
  getPackagesSync() {
    return makeSyncFileFinder(this.rootPath, this.packageConfigs)('package.json', (packageConfigPath: string) => {
      return new Package(
        loadJsonFile.sync(packageConfigPath),
        path.dirname(packageConfigPath),
        this.rootPath
      );
    });
  }

  getPackageLicensePaths() {
    return this.fileFinder(Project.LICENSE_GLOB, null, { caseSensitiveMatch: false });
  }

  isIndependent() {
    return this.version === 'independent';
  }

  serializeConfig() {
    // TODO: might be package.json prop
    return writeJsonFile(this.rootConfigLocation, this.config, { indent: 2, detectIndent: true }).then(
      () => this.rootConfigLocation
    );
  }
}

Project.PACKAGE_GLOB = 'packages/*';
Project.LICENSE_GLOB = 'LICEN{S,C}E{,.*}';

module.exports.getPackages = Project.getPackages;
module.exports.getPackagesSync = Project.getPackagesSync;
