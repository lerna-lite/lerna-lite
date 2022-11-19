import loadJsonFile from 'load-json-file';
import npa from 'npm-package-arg';
import npmlog from 'npmlog';
import path from 'path';
import writePkg from 'write-pkg';

import { CommandType, NpaResolveResult, RawManifest } from './models';

// symbol used to 'hide' internal state
const PKG = Symbol('pkg');

// private fields
const _location = Symbol('location');
const _resolved = Symbol('resolved');
const _rootPath = Symbol('rootPath');
const _scripts = Symbol('scripts');
const _contents = Symbol('contents');

/**
 * @param {import('npm-package-arg').Result} result
 */
function binSafeName({ name, scope }: npa.Result) {
  return scope ? name!.substring(scope.length + 1) : name;
}

// package.json files are not that complicated, so this is intentionally naïve
function shallowCopy(json: any) {
  return Object.keys(json).reduce((obj, key) => {
    const val: any = json[key];

    /* istanbul ignore if */
    if (Array.isArray(val)) {
      obj[key] = val.slice();
    } else if (val && typeof val === 'object') {
      obj[key] = Object.assign({}, val);
    } else {
      obj[key] = val;
    }

    return obj;
  }, {});
}

/**
 * Lerna's internal representation of a local package, with
 * many values resolved directly from the original JSON.
 */
export class Package {
  _id = '';
  name: string;
  licensePath = '';
  localDependencies = new Map<string, any>();

  /**
   * Create a Package instance from parameters, possibly reusing existing instance.
   * @param {string|Package|RawManifest} ref A path to a package.json file, Package instance, or JSON object
   * @param {string} [dir] If `ref` is a JSON object, this is the location of the manifest
   * @returns {Package}
   */
  static lazy(ref: string | Package | RawManifest, dir = '.'): Package {
    if (typeof ref === 'string') {
      const location = path.resolve(path.basename(ref) === 'package.json' ? path.dirname(ref) : ref);
      const manifest = loadJsonFile.sync<RawManifest>(path.join(location, 'package.json'));

      return new Package(manifest, location);
    }

    // don't use instanceof because it fails across nested module boundaries
    if ('__isLernaPackage' in ref) {
      return ref;
    }

    // assume ref is a json object
    return new Package(ref, dir);
  }

  /**
   * @param {RawManifest} pkg
   * @param {string} location
   * @param {string} [rootPath]
   */
  constructor(pkg: RawManifest, location: string, rootPath = location) {
    // npa will throw an error if the name is invalid
    const resolved = npa.resolve(pkg?.name ?? '', `file:${path.relative(rootPath, location)}`, rootPath);

    this.name = pkg?.name ?? '';
    this[PKG] = pkg;

    // omit raw pkg from default util.inspect() output, but preserve internal mutability
    Object.defineProperty(this, PKG, { enumerable: false, writable: true });

    this[_location] = location;
    this[_resolved] = resolved;
    this[_rootPath] = rootPath;
    this[_scripts] = { ...pkg.scripts };
  }

  // readonly getters
  get location(): string {
    return this[_location];
  }

  get private(): boolean {
    return Boolean(this[PKG].private);
  }

  get resolved(): { name: string; bin: any; scope: any } {
    return this[_resolved];
  }

  get rootPath(): string {
    return this[_rootPath];
  }

  get scripts() {
    return this[_scripts];
  }

  get bin() {
    const pkg = this[PKG];
    return typeof pkg.bin === 'string'
      ? { [binSafeName(this.resolved as unknown as npa.Result) as string]: pkg.bin }
      : Object.assign({}, pkg.bin);
  }

  get binLocation(): string {
    return path.join(this.location, 'node_modules', '.bin');
  }

  /** alias to pkg getter (to avoid calling duplicate prop like `node.pkg.pkg` in which node is PackageGraphNode) */
  get manifest(): RawManifest {
    return this[PKG];
  }

  get manifestLocation(): string {
    return path.join(this.location, 'package.json');
  }

  get nodeModulesLocation(): string {
    return path.join(this.location, 'node_modules');
  }

  // eslint-disable-next-line class-methods-use-this
  get __isLernaPackage(): boolean {
    // safer than instanceof across module boundaries
    return true;
  }

  // accessors
  get version(): string {
    return this[PKG].version;
  }

  set version(version: string) {
    this[PKG].version = version;
  }

  get workspaces(): string[] | { packages: string[] } {
    return this[PKG].workspaces;
  }

  set workspaces(workspaces: string[] | { packages: string[] }) {
    this[PKG].workspaces = workspaces;
  }

  get contents() {
    // if modified with setter, use that value
    if (this[_contents]) {
      return this[_contents];
    }

    // if provided by pkg.publishConfig.directory value
    if (this[PKG].publishConfig && this[PKG].publishConfig.directory) {
      return path.join(this.location, this[PKG].publishConfig.directory);
    }

    // default to package root
    return this.location;
  }

  set contents(subDirectory: string) {
    this[_contents] = path.join(this.location, subDirectory);
  }

  // 'live' collections
  get dependencies(): { [depName: string]: string } {
    return this[PKG].dependencies;
  }

  get devDependencies(): { [depName: string]: string } {
    return this[PKG].devDependencies;
  }

  get optionalDependencies(): { [depName: string]: string } {
    return this[PKG].optionalDependencies;
  }

  get peerDependencies(): { [depName: string]: string } {
    return this[PKG].peerDependencies;
  }

  get pkg(): Package {
    return this[PKG];
  }

  /**
   * Map-like retrieval of arbitrary values
   * @template {keyof RawManifest} K
   * @param {K} key field name to retrieve value
   * @returns {RawManifest[K]} value stored under key, if present
   */
  get<K extends keyof RawManifest>(key: string): K {
    return this[PKG][key];
  }

  /**
   * Map-like storage of arbitrary values
   * @template {keyof RawManifest} K
   * @param {T} key field name to store value
   * @param {RawManifest[K]} val value to store
   * @returns {Package} instance for chaining
   */
  set(key: string, val: RawManifest[keyof RawManifest]): Package {
    this[PKG][key] = val;

    return this;
  }

  /**
   * Provide shallow copy for munging elsewhere
   * @returns {Object}
   */
  toJSON() {
    return shallowCopy(this[PKG]);
  }

  /**
   * Refresh internal state from disk (e.g., changed by external lifecycles)
   */
  refresh() {
    return loadJsonFile(this.manifestLocation).then((pkg) => {
      this[PKG] = pkg;

      return this;
    });
  }

  /**
   * Write manifest changes to disk
   * @returns {Promise} resolves when write finished
   */
  serialize() {
    return writePkg(this.manifestLocation, this[PKG]).then(() => this);
  }

  /**
   * Mutate given dependency (could be local/external) spec according to type
   * @param {String} pkgName - package name
   * @param {Object} resolved npa metadata
   */
  removeDependencyWorkspaceProtocolPrefix(pkgName: string, resolved: NpaResolveResult) {
    const depName = resolved.name as string;
    const workspaceSpec = resolved?.workspaceSpec ?? '';
    const localDependencies = this.retrievePackageDependencies(depName);
    const inspectDependencies = [localDependencies];

    // package could be found in both a local dependencies and peerDependencies, so we need to include it when found
    if (this.peerDependencies?.[depName]) {
      inspectDependencies.push(this.peerDependencies);
    }

    for (const depCollection of inspectDependencies) {
      if (
        depCollection &&
        (resolved.registry || resolved.type === 'directory') &&
        /^(workspace:)+(.*)$/.test(workspaceSpec)
      ) {
        if (workspaceSpec) {
          if (resolved.fetchSpec === 'latest' || resolved.fetchSpec === '') {
            npmlog.error(
              `publish`,
              [
                `Your package named "${pkgName}" has external dependencies not handled by Lerna-Lite and without workspace version suffix, `,
                `we recommend using defined versions with workspace protocol. `,
                `Your dependency is currently being published with "${depName}": "${resolved.fetchSpec}".`,
              ].join('')
            );
          }
          depCollection[depName] = resolved.fetchSpec as string;
        }
      }
    }
  }

  /**
   * Mutate local dependency spec according to type
   * @param {Object} resolved npa metadata
   * @param {String} depVersion semver
   * @param {String} savePrefix npm_config_save_prefix
   * @param {Boolean} [workspaceStrictMatch] - are we using `workspace:` protocol strict match?
   * @param {String} [updatedByCommand] - which command called this update?
   */
  updateLocalDependency(
    resolved: NpaResolveResult,
    depVersion: string,
    savePrefix: string,
    allowPeerDependenciesUpdate = false,
    workspaceStrictMatch = true,
    updatedByCommand?: CommandType
  ) {
    const depName = resolved.name as string;
    const localDependencies = this.retrievePackageDependencies(depName);
    const updatingDependencies = [localDependencies];

    // when we have peer dependencies, we might need to perform certain things
    if (this.peerDependencies?.[depName]) {
      // when user allows peer bump and is a regular semver version, we'll push it to the array of dependencies to potentially bump
      // however we won't when the semver has a range with operator, ie this would bump ("^2.0.0") but these would not (">=2.0.0" or "workspace:<2.0.0" or "workspace:*")
      // prettier-ignore
      if (allowPeerDependenciesUpdate && /^(workspace:)?[~^]?[\d\.]+([\-]+[\w\.\-\+]+)*$/i.test(this.peerDependencies[depName] || '')) {
        updatingDependencies.push(this.peerDependencies);
      }
      // when peer bump is disabled, we could end up with peerDependencies not being reviewed
      // and some might still have the `workspace:` prefix so make sure to remove any of these prefixes
      else if (updatedByCommand === 'publish' && this.peerDependencies[depName].startsWith('workspace:')) {
        this.peerDependencies[depName] = this.peerDependencies[depName].replace('workspace:', '');
      }
    }

    for (const depCollection of updatingDependencies) {
      if (depCollection && (resolved.registry || resolved.type === 'directory')) {
        // a version (1.2.3) OR range (^1.2.3) OR directory (file:../foo-pkg)
        depCollection[depName] = `${savePrefix}${depVersion}`;

        // when using explicit `workspace:` protocol
        if (resolved.workspaceSpec) {
          const workspaceSpec = resolved?.workspaceSpec ?? '';
          const [_, _wsTxt, operatorPrefix, rangePrefix, semver] =
            workspaceSpec.match(/^(workspace:)?([<>=]{0,2})?([*|~|^])?(.*)$/) || [];

          if (operatorPrefix) {
            // package with range operator should never be bumped, we'll use same version range but without prefix "workspace:>=1.2.3" will assign ">=1.2.3"
            depCollection[depName] = `${operatorPrefix}${rangePrefix || ''}${semver}`;
          } else if (workspaceStrictMatch) {
            // with workspace in strict mode we might have empty range prefix like "workspace:1.2.3"
            depCollection[depName] = `${rangePrefix || ''}${depVersion}`;
          }

          if (updatedByCommand === 'publish') {
            // when publishing, workspace protocol will be transformed to semver range
            // e.g.: considering version is `1.2.3` and we have `workspace:*` it will be converted to "^1.2.3" or to "1.2.3" with strict match range enabled
            if (workspaceStrictMatch) {
              if (workspaceSpec === 'workspace:*') {
                depCollection[depName] = depVersion; // (*) exact range, "1.5.0"
              } else if (workspaceSpec === 'workspace:~') {
                depCollection[depName] = `~${depVersion}`; // (~) patch range, "~1.5.0"
              } else if (workspaceSpec === 'workspace:^') {
                depCollection[depName] = `^${depVersion}`; // (^) minor range, "^1.5.0"
              }
            }
            // anything else will fall under what Lerna previously found to be the version,
            // typically by this line: depCollection[depName] = `${savePrefix}${depVersion}`;
          } else {
            // when versioning we'll only bump workspace protocol that have semver range like `workspace:^1.2.3`
            // any other workspace will remain the same in `package.json` file, for example `workspace:^`
            // keep target workspace or bump when it's a workspace semver range (like `workspace:^1.2.3`)
            depCollection[depName] = /^workspace:[*|~|^]{1}$/.test(workspaceSpec)
              ? (resolved.workspaceSpec as string) // target like `workspace:^` => `workspace:^` (remains untouched in package.json)
              : `workspace:${depCollection[depName]}`; // range like `workspace:^1.2.3` => `workspace:^1.3.3` (bump minor example)
          }
        }
      } else if (resolved.gitCommittish) {
        // a git url with matching committish (#v1.2.3 or #1.2.3)
        const [tagPrefix] = /^\D*/.exec(resolved.gitCommittish) as RegExpExecArray;

        // update committish
        const { hosted } = resolved as any; // take that, lint!
        hosted.committish = `${tagPrefix}${depVersion}`;

        // always serialize the full url (identical to previous resolved.saveSpec)
        depCollection[depName] = hosted.toString({ noGitPlus: false, noCommittish: false });
      } else if (resolved.gitRange) {
        // a git url with matching gitRange (#semver:^1.2.3)
        const { hosted } = resolved as any; // take that, lint!
        hosted.committish = `semver:${savePrefix}${depVersion}`;

        // always serialize the full url (identical to previous resolved.saveSpec)
        depCollection[depName] = hosted.toString({ noGitPlus: false, noCommittish: false });
      }
    }
  }

  /**
   * Retrieve the dependencies collection which contain the dependency name provided, we'll search in all type of dependencies/devDependencies/...
   * @param {String} depName - dependency name
   * @returns {Array<String>} - array of dependencies that contains the dependency name provided
   */
  private retrievePackageDependencies(depName: string): { [depName: string]: string } {
    // first, try runtime dependencies
    let depCollection = this.dependencies;

    // try optionalDependencies if that didn't work
    if (!depCollection || !depCollection[depName]) {
      depCollection = this.optionalDependencies;
    }

    // fall back to devDependencies
    if (!depCollection || !depCollection[depName]) {
      depCollection = this.devDependencies;
    }

    return depCollection;
  }
}
