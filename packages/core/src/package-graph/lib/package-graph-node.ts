import { Result } from 'npm-package-arg';
import semver from 'semver';

import { Package } from '../../package';
import { prereleaseIdFromVersion } from '../../utils/prerelease-id-from-version';

const PKG = Symbol('pkg');

/**
 * A node in a PackageGraph.
 */
export class PackageGraphNode {
  name: string;
  externalDependencies: Map<string, any>;
  localDependencies: Map<string, any>;
  localDependents: Map<string, any>;

  /**
   * @param {import("@lerna/package").Package} pkg
   */
  constructor(pkg: Package) {
    this.name = pkg?.name ?? '';
    this[PKG] = pkg;

    // omit raw pkg from default util.inspect() output
    Object.defineProperty(this, PKG, { enumerable: false });

    this.externalDependencies = new Map<string, Result>();
    this.localDependencies = new Map<string, Result>();
    this.localDependents = new Map<string, PackageGraphNode>();
  }

  get location(): string {
    return this[PKG].location;
  }

  get pkg(): Package {
    return this[PKG];
  }

  get prereleaseId() {
    return prereleaseIdFromVersion(this.version);
  }

  get version(): string {
    return this[PKG].version;
  }

  /**
   * Determine if the Node satisfies a resolved semver range.
   * @see https://github.com/npm/npm-package-arg#result-object
   *
   * @param {!Result} resolved npm-package-arg Result object
   * @returns {Boolean}
   */
  satisfies({ gitCommittish, gitRange, fetchSpec }: Partial<Result>): boolean {
    return semver.satisfies(this.version, (gitCommittish || gitRange || fetchSpec) as string | semver.Range);
  }

  /**
   * Returns a string representation of this node (its name)
   *
   * @returns {String}
   */
  toString(): string {
    return this.name;
  }
}
