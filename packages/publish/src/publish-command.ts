import { realpathSync } from 'node:fs';
import { EOL, tmpdir } from 'node:os';
import { join as pathJoin, normalize, relative } from 'node:path';

import type {
  CommandType,
  Conf,
  NpaResolveResult,
  Package,
  PackageGraphNode,
  ProjectConfig,
  PublishCommandOption,
  UpdateCollectorOptions,
} from '@lerna-lite/core';
import {
  collectUpdates,
  Command,
  createRunner,
  deleteComplexObjectProp,
  describeRef,
  excludeValuesFromArray,
  logOutput,
  npmConf,
  prereleaseIdFromVersion,
  promptConfirmation,
  pulseTillDone,
  runTopologically,
  throwIfUncommitted,
  ValidationError,
} from '@lerna-lite/core';
import type { OneTimePasswordCache } from '@lerna-lite/version';
import { getOneTimePassword, VersionCommand } from '@lerna-lite/version';
import crypto from 'crypto';
import { outputFileSync, removeSync } from 'fs-extra/esm';
import normalizePath from 'normalize-path';
import pMap from 'p-map';
import pPipe, { type UnaryFunction } from 'p-pipe';
import semver from 'semver';
import { glob } from 'tinyglobby';
import c from 'tinyrainbow';

import type { Tarball } from './interfaces.js';
import { createTempLicenses } from './lib/create-temp-licenses.js';
import { getCurrentSHA } from './lib/get-current-sha.js';
import { getCurrentTags } from './lib/get-current-tags.js';
import { getNpmUsername } from './lib/get-npm-username.js';
import { getPackagesWithoutLicense } from './lib/get-packages-without-license.js';
import { getTaggedPackages } from './lib/get-tagged-packages.js';
import { getTwoFactorAuthRequired } from './lib/get-two-factor-auth-required.js';
import { getUnpublishedPackages } from './lib/get-unpublished-packages.js';
import { gitCheckout } from './lib/git-checkout.js';
import { isNpmJsPublishVersionConflict } from './lib/is-npm-js-publish-version-conflict.js';
import { isNpmPkgGitHubPublishVersionConflict } from './lib/is-npm-pkg-github-publish-version-conflict.js';
import { logPacked } from './lib/log-packed.js';
import { add, remove } from './lib/npm-dist-tag.js';
import { npmPublish } from './lib/npm-publish.js';
import { overridePublishConfig } from './lib/override-publish-config.js';
import { packDirectory } from './lib/pack-directory.js';
import { removeTempLicenses } from './lib/remove-temp-licenses.js';
import type { Queue } from './lib/throttle-queue.js';
import { TailHeadQueue } from './lib/throttle-queue.js';
import { verifyNpmPackageAccess } from './lib/verify-npm-package-access.js';

export function factory(argv: PublishCommandOption) {
  return new PublishCommand(argv);
}

export class PublishCommand extends Command<PublishCommandOption> {
  /** command name */
  name = 'publish' as CommandType;
  conf!: Conf & { snapshot?: any };
  otpCache!: OneTimePasswordCache;
  gitReset = false;
  savePrefix = '';
  tagPrefix = '';
  hasRootedLeaf = false;
  npmSession = '';
  packagesToPublish: Package[] = [];
  publishedPackages: Package[] = [];
  packagesToBeLicensed?: Package[] = [];
  runPackageLifecycle!: (pkg: Package, stage: string) => Promise<void>;
  runRootLifecycle!: (stage: string) => Promise<void> | void;
  verifyAccess?: boolean = false;
  toposort = false;
  twoFactorAuthRequired = false;
  updates: PackageGraphNode[] = [];
  updatesVersions?: Map<string, any>;

  get otherCommandConfigs() {
    // back-compat
    return ['version'];
  }

  get requiresGit() {
    // `lerna publish from-package` doesn't _need_ git, per se
    return this.options.bump !== 'from-package';
  }

  constructor(argv: PublishCommandOption | ProjectConfig) {
    super(argv);
  }

  configureProperties() {
    super.configureProperties();

    // For publish we want to enable topological sorting by default, but allow users to override with --no-sort
    this.toposort = this.options.sort !== false;

    // Defaults are necessary here because yargs defaults
    // override durable options provided by a config file
    const {
      // prettier-ignore
      exact,
      gitHead,
      gitReset,
      tagVersionPrefix = 'v',
      verifyAccess,
    } = this.options;

    if (this.requiresGit && gitHead) {
      throw new ValidationError('EGITHEAD', '--git-head is only allowed with "from-package" positional');
    }

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = exact ? '' : '^';

    // https://docs.npmjs.com/misc/config#tag-version-prefix
    this.tagPrefix = tagVersionPrefix;
    // TODO: properly inherit from npm-conf

    // inverted boolean options are only respected if prefixed with `--no-`, e.g. `--no-verify-access`
    this.gitReset = gitReset !== false;

    // consumed by npm-registry-fetch (via libnpmpublish)
    this.npmSession = crypto.randomBytes(8).toString('hex');

    this.verifyAccess = verifyAccess;
  }

  get userAgent() {
    // consumed by npm-registry-fetch (via libnpmpublish)
    return `lerna/${this.options.lernaVersion}/node@${process.version}+${process.arch} (${process.platform})`;
  }

  initialize() {
    if (this.options.verifyAccess === false) {
      this.logger.warn(
        'verify-access',
        '--verify-access=false and --no-verify-access are no longer needed, because the legacy preemptive access verification is now disabled by default. Requests will fail with appropriate errors when not authorized correctly.'
      );
    }

    if (this.options.graphType === 'dependencies') {
      this.logger.warn(
        'graph-type',
        '--graph-type=dependencies is deprecated and will be removed in the next major version of lerna-lite. If you have a use-case you feel requires it please open an issue to discuss: https://github.com/lerna/lerna/issues/new/choose'
      );
    }

    if (this.options.buildMetadata && this.options.canary) {
      throw new ValidationError('ENOTSATISFIED', 'Cannot use --build-metadata in conjunction with --canary option.');
    } else if (this.options.canary) {
      this.logger.info('canary', 'enabled');
    }

    // npmSession and user-agent are consumed by npm-registry-fetch (via libnpmpublish)
    this.logger.verbose('session', this.npmSession);
    this.logger.verbose('user-agent', this.userAgent);

    this.conf = npmConf({
      lernaCommand: 'publish',
      _auth: this.options.legacyAuth,
      npmSession: this.npmSession,
      npmVersion: this.userAgent,
      otp: this.options.otp,
      registry: this.options.registry,
      'ignore-prepublish': this.options.ignorePrepublish,
      'ignore-scripts': this.options.ignoreScripts,
    });

    // cache to hold a one-time-password across publishes
    this.otpCache = { otp: this.conf.get('otp') };

    this.conf.set('user-agent', this.userAgent, 'cli');

    if (this.conf.get('registry') === 'https://registry.yarnpkg.com') {
      this.logger.warn('', `Yarn's registry proxy is broken, replacing with public npm registry`);
      this.logger.warn('', `If you don't have an npm token, you should exit and run "npm login"`);
      this.conf.set('registry', 'https://registry.npmjs.org/', 'cli');
    }

    // inject --dist-tag into opts, if present
    const distTag = this.getDistTag();

    if (distTag) {
      this.conf.set('tag', distTag.trim(), 'cli');
    }

    // a 'rooted leaf' is the regrettable pattern of adding '.' to the 'packages' config in lerna.json
    this.hasRootedLeaf = this.packageGraph.has(this.project.manifest.name);

    if (this.hasRootedLeaf) {
      this.logger.info('publish', 'rooted leaf detected, skipping synthetic root lifecycles');
    }

    this.runPackageLifecycle = createRunner(this.options);

    // don't execute recursively if run from a poorly-named script
    this.runRootLifecycle = /^(pre|post)?publish$/.test(process.env.npm_lifecycle_event || '')
      ? (stage) => this.logger.warn('lifecycle', 'Skipping root %j because it has already been called', stage)
      : (stage) => this.runPackageLifecycle(this.project.manifest, stage);

    let chain: Promise<any> = Promise.resolve();

    if (this.options.bump === 'from-git') {
      chain = chain.then(() => this.detectFromGit());
    } else if (this.options.bump === 'from-package') {
      chain = chain.then(() => this.detectFromPackage());
    } else if (this.options.canary) {
      chain = chain.then(() => this.detectCanaryVersions());
    } else {
      chain = chain.then(() => new VersionCommand(this.argv));
    }

    return chain.then(
      (result: { updates: PackageGraphNode[]; updatesVersions: Map<string, any>; needsConfirmation: boolean }) => {
        if (!result) {
          // early return from nested VersionCommand
          return false;
        }

        if (!result.updates.length) {
          this.logger.success('No changed packages to publish');

          // still exits zero, aka 'ok'
          return false;
        }

        // (occasionally) redundant private filtering necessary to handle nested VersionCommand
        this.updates = result.updates.filter((node) => !node.pkg.private);
        this.updatesVersions = new Map(result.updatesVersions);

        this.packagesToPublish = this.updates.map((node) => node.pkg);

        if (this.options.contents) {
          // globally override directory to publish
          for (const pkg of this.packagesToPublish) {
            pkg.contents = this.options.contents;
          }
        }

        if (result.needsConfirmation) {
          // only confirm for --canary, bump === 'from-git',
          // or bump === 'from-package', as VersionCommand
          // has its own confirmation prompt
          return this.confirmPublish();
        }

        return true;
      }
    );
  }

  async execute() {
    const logPrefix = this.options.dryRun ? c.bgMagenta('[dry-run]') : '';
    this.enableProgressBar();
    this.logger.info('publish', `Publishing packages to npm... ${logPrefix}`);

    await this.prepareRegistryActions();
    await this.prepareLicenseActions();

    if (this.options.canary) {
      await this.updateCanaryVersions();
    }

    await this.resolveLocalDependencyLinks();
    await this.resolveDependencyWithCatalogProtocols();
    await this.resolveLocalDependencyWorkspaceProtocols();

    if (this.options.removePackageFields || this.options.stripPackageKeys) {
      await this.removePackageProperties();
    }

    if (this.options.publishConfigOverrides !== false) {
      await this.applyPublishConfigOverrides();
    }
    this.annotateGitHead();
    await this.serializeChanges();
    await this.packUpdated();
    await this.publishPacked();

    if (this.gitReset) {
      await this.resetChanges();
    }

    if (this.options.tempTag) {
      await this.npmUpdateAsLatest();
    }

    const count = this.publishedPackages?.length;
    const publishedPackagesSorted = this.publishedPackages.sort((a, b) => a.name.localeCompare(b.name));

    if (!count) {
      this.logger.success('All packages have already been published.');
      return;
    }

    logOutput(`Successfully published: ${logPrefix}`);

    if (this.options.summaryFile !== undefined) {
      const filePath = this.getSummaryFilePath();
      const jsonObject = publishedPackagesSorted.map((pkg) => {
        return {
          packageName: pkg.name,
          version: pkg.version,
        };
      });
      logOutput(jsonObject);
      try {
        outputFileSync(filePath, JSON.stringify(jsonObject));
        logOutput('Publish summary created: ', filePath);
      } catch (error) {
        /* v8 ignore next */
        logOutput('Failed to create the summary report', error);
      }
    } else {
      const message = publishedPackagesSorted.map((pkg) => ` - ${pkg.name}@${pkg.version}`);
      logOutput(message.join(EOL));
    }

    // optionally cleanup temp packed files after publish, opt-in option
    if (this.options.cleanupTempFiles) {
      const tempDirPath = realpathSync(tmpdir());
      const normalizedLernaPath = normalizePath(pathJoin(tempDirPath, 'lerna-*'));
      glob(normalizedLernaPath, { absolute: true, cwd: tempDirPath, onlyDirectories: true }).then((deleteFolders) => {
        // silently delete all files/folders that startsWith "lerna-"
        deleteFolders.forEach((folder) => removeSync(folder));
        this.logger.verbose('publish', `Found ${deleteFolders.length} temp folders to cleanup after publish.`);
      });
    }

    this.logger.success('published', `%d %s ${logPrefix}`, count, count === 1 ? 'package' : 'packages');
  }

  verifyWorkingTreeClean() {
    return describeRef(this.execOpts, undefined, this.options.dryRun).then(throwIfUncommitted);
  }

  detectFromGit() {
    const matchingPattern = this.project.isIndependent() ? `*@*` : `${this.tagPrefix}*.*.*`;

    let chain: Promise<any> = Promise.resolve();

    // attempting to publish a tagged release with local changes is not allowed
    chain = chain.then(() => this.verifyWorkingTreeClean());

    chain = chain.then(() => getCurrentTags(this.execOpts, matchingPattern));
    chain = chain.then((taggedPackageNames: string[]) => {
      if (!taggedPackageNames.length) {
        this.logger.notice('from-git', 'No tagged release found. You might not have fetched tags.');
        return [];
      }

      if (this.project.isIndependent()) {
        return taggedPackageNames.map((name) => this.packageGraph.get(name));
      }

      return getTaggedPackages(this.packageGraph, this.project.rootPath, this.execOpts);
    });

    // private packages are never published, full stop.
    chain = chain.then((updates: Package[]) => updates.filter((node) => !node.pkg.private));

    return chain.then((updates: Package[]) => {
      const updatesVersions = updates.map((node) => [node.name, node.version]);

      return {
        updates,
        updatesVersions,
        needsConfirmation: true,
      };
    });
  }

  detectFromPackage() {
    let chain: Promise<any> = Promise.resolve();

    // attempting to publish a release with local changes is not allowed
    chain = chain
      .then(() => this.verifyWorkingTreeClean())
      .catch((err: any) => {
        // an execa error is thrown when git suffers a fatal error (such as no git repository present)
        if (err.failed && /git describe/.test(err.command)) {
          // (we tried)
          this.logger.silly('EWORKINGTREE', err.message);
          this.logger.notice('FYI', 'Unable to verify working tree, proceed at your own risk');
          process.exitCode = 0;
        } else {
          // validation errors should be preserved
          throw err;
        }
      });

    // private packages are already omitted by getUnpublishedPackages()
    chain = chain.then(() => getUnpublishedPackages(this.packageGraph, this.conf.snapshot));
    chain = chain.then((unpublished) => {
      if (!unpublished.length) {
        this.logger.notice('from-package', 'No unpublished release found');
      }

      return unpublished;
    });

    return chain.then((updates) => {
      const updatesVersions = updates.map((node: PackageGraphNode) => [node.name, node.version]);

      return {
        updates,
        updatesVersions,
        needsConfirmation: true,
      };
    });
  }

  detectCanaryVersions() {
    const { cwd } = this.execOpts;
    const { bump = 'prepatch', preid = 'alpha', ignoreChanges, forcePublish, includeMergedTags } = this.options;
    // 'prerelease' and 'prepatch' are identical, for our purposes
    const release = bump.startsWith('pre') ? bump.replace('release', 'patch') : `pre${bump}`;

    let chain: Promise<any> = Promise.resolve();

    // attempting to publish a canary release with local changes is not allowed
    chain = chain
      .then(() => this.verifyWorkingTreeClean())
      .catch((err: any) => {
        // an execa error is thrown when git suffers a fatal error (such as no git repository present)
        if (err.failed && /git describe/.test(err.command)) {
          // (we tried)
          this.logger.silly('EWORKINGTREE', err.message);
          this.logger.notice('FYI', 'Unable to verify working tree, proceed at your own risk');
        } else {
          // validation errors should be preserved
          throw err;
        }
      });

    const isIndependent = this.project.isIndependent();
    const describeTag = this.project.config.describeTag;

    // find changed packages since last release, if any
    chain = chain.then(() =>
      collectUpdates(this.packageGraph?.rawPackageList ?? [], this.packageGraph, this.execOpts, {
        bump: 'prerelease',
        canary: true,
        ignoreChanges,
        forcePublish,
        includeMergedTags,
        isIndependent,
        describeTag,
        // private packages are never published, don't bother describing their refs.
      } as UpdateCollectorOptions).filter((node) => !node.pkg.private)
    );

    // prettier-ignore
    const makeVersion = (fallback: string) => ({ lastVersion = fallback, refCount, sha }) => {
      // the next version is bumped without concern for preid or current index
      // prettier-ignore
      const nextVersion = semver.inc(lastVersion.replace(this.tagPrefix, ''), release.replace('pre', '') as semver.ReleaseType);

      // semver.inc() starts a new prerelease at .0, git describe starts at .1
      // and build metadata is always ignored when comparing dependency ranges
      return `${nextVersion}-${preid}.${Math.max(0, refCount - 1)}.${sha}`;
    };

    if (isIndependent) {
      // each package is described against its tags only
      chain = chain.then((updates) =>
        pMap(updates, (node: Package) =>
          describeRef(
            {
              match: `${node.name}@*`,
              cwd,
            },
            includeMergedTags
          )
            // an unpublished package will have no reachable git tag
            .then(makeVersion(node.version))
            .then((version) => [node.name, version])
        ).then((updatesVersions) => ({
          updates,
          updatesVersions,
        }))
      );
    } else {
      // all packages are described against the last tag
      chain = chain.then((updates) =>
        describeRef(
          {
            match: `${this.tagPrefix}*.*.*`,
            cwd,
          },
          includeMergedTags
        )
          // a repo with no tags should default to whatever lerna.json claims
          .then(makeVersion(this.project.version))
          .then((version) => updates.map((node) => [node.name, version]))
          .then((updatesVersions) => ({
            updates,
            updatesVersions,
          }))
      );
    }

    return chain.then(({ updates, updatesVersions }) => ({
      updates,
      updatesVersions,
      needsConfirmation: true,
    }));
  }

  confirmPublish() {
    const logPrefix = this.options.dryRun ? c.bgMagenta('[dry-run]') : '';
    const count = this.packagesToPublish?.length;
    const message = this.packagesToPublish?.map((pkg) => ` - ${pkg.name} => ${this.updatesVersions?.get(pkg.name)}`) ?? [];

    logOutput('');
    logOutput(`Found ${count} ${count === 1 ? 'package' : 'packages'} to publish: ${logPrefix}`);
    logOutput(message.join(EOL));
    logOutput('');

    if (this.options.yes) {
      this.logger.info('auto-confirmed', '');
      return true;
    }

    let confirmMessage = this.options.dryRun ? c.bgMagenta('[dry-run]') : '';
    confirmMessage += ' Are you sure you want to publish these packages?';
    return promptConfirmation(confirmMessage.trim());
  }

  prepareLicenseActions() {
    return Promise.resolve()
      .then(() => getPackagesWithoutLicense(this.project, this.packagesToPublish ?? []))
      .then((packagesWithoutLicense) => {
        if (packagesWithoutLicense.length && !this.project.licensePath) {
          this.packagesToBeLicensed = [];

          const names = packagesWithoutLicense.map((pkg) => pkg.name);
          const noun = names.length > 1 ? 'Packages' : 'Package';
          const verb = names.length > 1 ? 'are' : 'is';
          const list =
            // prettier-ignore
            names.length > 1
              ? `${names.slice(0, -1).join(', ')}${names.length > 2 ? ',' : ''} and ${names[names.length - 1] /* oxford commas _are_ that important */ }`
              : names[0];

          this.logger.warn(
            'ENOLICENSE',
            '%s %s %s missing a license.\n%s\n%s',
            noun,
            list,
            verb,
            'One way to fix this is to add a LICENSE.md file to the root of this repository.',
            'See https://choosealicense.com for additional guidance.'
          );
        } else {
          this.packagesToBeLicensed = packagesWithoutLicense;
        }
      });
  }

  prepareRegistryActions() {
    let chain: Promise<any> = Promise.resolve();

    if (this.conf.get('registry') !== 'https://registry.npmjs.org/') {
      this.logger.notice('', 'Skipping all user and access validation due to third-party registry');
      this.logger.notice('', `Make sure you're authenticated properly "\\_(ツ)_ /"`);

      return chain;
    }

    /* v8 ignore next if */
    if (process.env.LERNA_INTEGRATION) {
      return chain;
    }

    if (this.verifyAccess) {
      // validate user has valid npm credentials first,
      // by far the most common form of failed execution
      chain = chain.then(() => getNpmUsername(this.conf.snapshot));
      chain = chain.then((username: string) => {
        // if no username was retrieved, don't bother validating
        if (username) {
          return verifyNpmPackageAccess(this.packagesToPublish ?? [], username, this.conf.snapshot);
        }
      });

      // read profile metadata to determine if account-level 2FA is enabled
      chain = chain.then(() => getTwoFactorAuthRequired(this.conf.snapshot));
      chain = chain.then((isRequired) => {
        // notably, this still doesn't handle package-level 2FA requirements
        this.twoFactorAuthRequired = isRequired;
      });
    }

    return chain;
  }

  updateCanaryVersions() {
    return pMap(this.updates, (node: PackageGraphNode) => {
      node.pkg.set('version', this.updatesVersions?.get(node.name));

      for (const [depName, resolved] of node.localDependencies) {
        // other canary versions need to be updated, non-canary is a no-op
        const depVersion = this.updatesVersions?.get(depName) || this.packageGraph?.get(depName)!.pkg.version;

        // it no longer matters if we mutate the shared Package instance
        node.pkg.updateLocalDependency(
          resolved,
          depVersion,
          this.savePrefix,
          this.options.allowPeerDependenciesUpdate,
          this.commandName
        );
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  /**
   * It is possible to override some fields in the manifest before the package is packed
   * @see https://pnpm.io/package_json#publishconfig
   * @returns
   */
  applyPublishConfigOverrides() {
    // potentially apply any packages that might have publishConfig overrides
    return pMap(this.updates, (node) => overridePublishConfig(node.pkg.manifest));
  }

  resolveLocalDependencyLinks() {
    // resolve relative file: links to their actual version range
    const updatesWithLocalLinks = this.updates.filter((node: PackageGraphNode) =>
      Array.from(node.localDependencies.values()).some((resolved: NpaResolveResult) => resolved.type === 'directory')
    );

    return pMap(updatesWithLocalLinks, (node: PackageGraphNode) => {
      for (const [depName, resolved] of node.localDependencies) {
        // regardless of where the version comes from, we can't publish 'file:../sibling-pkg' specs
        const depVersion = this.updatesVersions?.get(depName) || this.packageGraph?.get(depName)!.pkg.version;

        // it no longer matters if we mutate the shared Package instance
        node.pkg.updateLocalDependency(
          resolved,
          depVersion,
          this.savePrefix,
          this.options.allowPeerDependenciesUpdate,
          this.commandName
        );
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  // resolve `catalog:` protocol from both local/external dependencies and translates them to their actual version target/range
  resolveDependencyWithCatalogProtocols() {
    // detect if any of the packages to publish have `catalog:` protocol in their dependencies
    const publishingPackagesWithCatalogs = this.updates.filter(
      (node: PackageGraphNode) =>
        Array.from<NpaResolveResult>(node.externalDependencies.values()).some((resolved) => resolved.catalogSpec) ||
        Array.from<NpaResolveResult>(node.localDependencies.values()).some((resolved) => resolved.catalogSpec)
    );

    return pMap(publishingPackagesWithCatalogs, (node: PackageGraphNode) => {
      // regardless of where the version comes from, we can't publish 'catalog:' specs, it has to be transformed for any dependencies
      // e.g. considering version is `^1.2.3` and we have a global `catalog:` it will be converted to version "^1.2.3" with strict match

      // update catalog version with global catalog version of external dependencies
      const externalDeps = Array.from<NpaResolveResult>(node.externalDependencies.values()).filter((node) => node.catalogSpec);
      const localDeps = Array.from<NpaResolveResult>(node.localDependencies.values()).filter((node) => node.catalogSpec);
      for (const deps of [externalDeps, localDeps]) {
        for (const resolved of deps) {
          // it no longer matters if we mutate the shared Package instance
          node.pkg.updateDependencyCatalogProtocol(resolved);
        }
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  resolveLocalDependencyWorkspaceProtocols() {
    // resolve workspace protocol: translates to their actual version target/range
    const publishingPackagesWithLocalWorkspaces = this.updates.filter((node: PackageGraphNode) =>
      Array.from(node.localDependencies.values()).some((resolved: NpaResolveResult) => resolved.workspaceSpec)
    );

    return pMap(publishingPackagesWithLocalWorkspaces, (node: PackageGraphNode) => {
      // regardless of where the version comes from, we can't publish 'workspace:*' specs, it has to be transformed for both local & external dependencies
      // e.g. considering version is `1.2.3` and we have `workspace:*` it will be converted to "^1.2.3" or to "1.2.3" with strict match range enabled

      // 1. update & bump version of local dependencies
      for (const [depName, resolved] of node.localDependencies) {
        const depVersion = this.updatesVersions?.get(depName) || this.packageGraph?.get(depName)!.pkg.version;

        // it no longer matters if we mutate the shared Package instance
        node.pkg.updateLocalDependency(
          resolved,
          depVersion,
          this.savePrefix,
          this.options.allowPeerDependenciesUpdate,
          this.commandName
        );
      }

      // 2. remove any "workspace:" prefix from the package to be published any of external dependencies (without anything being bumped)
      // we will only accept "workspace:" with semver version, for example "workspace:1.2.3" is ok but "workspace:*" will log an error
      for (const [_depName, resolved] of node.externalDependencies) {
        node.pkg.removeDependencyWorkspaceProtocolPrefix(node.name, resolved);
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  annotateGitHead() {
    try {
      const gitHead = this.options.gitHead || getCurrentSHA(this.execOpts);

      for (const pkg of this.packagesToPublish ?? []) {
        // provide gitHead property that is normally added during npm publish
        pkg.set('gitHead', gitHead);
      }
    } catch (err: any) {
      // from-package should be _able_ to run without git, but at least we tried
      this.logger.silly('EGITHEAD', err.message);
      this.logger.notice('FYI', 'Unable to set temporary gitHead property, it will be missing from registry metadata');
    }

    // writing changes to disk handled in serializeChanges()
  }

  serializeChanges() {
    return pMap(this.packagesToPublish ?? [], (pkg) => pkg.serialize());
  }

  resetChanges() {
    // the package.json files are changed (by gitHead if not --canary)
    // and we should always __attempt_ to leave the working tree clean
    const { cwd } = this.execOpts;
    const gitOpts = {
      granularPathspec: this.options.granularPathspec !== false,
    };
    // prettier-ignore
    const dirtyManifests = [this.project.manifest]
      .concat(this.packagesToPublish)
      .map((pkg) => relative(cwd, pkg.manifestLocation));

    return gitCheckout(dirtyManifests, gitOpts, this.execOpts, this.options.dryRun).catch((err) => {
      this.logger.silly('EGITCHECKOUT', err.message);
      this.logger.notice('FYI', `Unable to reset working tree changes, this probably isn't a git repo.`);
    });
  }

  removePackageProperties() {
    const stripPackageKeys = this.options.removePackageFields || this.options.stripPackageKeys;
    if (this.options.removePackageFields) {
      this.logger.warn(
        'DEPRECATION',
        '"--remove-package-fields" was renamed to "--strip-package-keys" and will be removed in the next major release.'
      );
    }

    return pMap(this.packagesToPublish, (node: Package) => {
      if (Array.isArray(stripPackageKeys)) {
        for (const fieldToStrip of stripPackageKeys) {
          if (fieldToStrip === 'scripts') {
            // when deleting field "scripts", we need to keep any lifecycle script(s) to avoid failure when packing tarball
            const scriptNames = Object.keys(node.pkg['scripts'] ?? {});
            const remainingScripts = excludeValuesFromArray(scriptNames, ['prepublish', 'prepublishOnly', 'prepack', 'postpack']);
            if (remainingScripts.length < scriptNames.length) {
              remainingScripts.forEach((scriptName) =>
                deleteComplexObjectProp(node.pkg['scripts'], scriptName, `"${node.pkg.name}" package`)
              );
              continue; // to next package
            }
          }
          deleteComplexObjectProp(node.pkg, fieldToStrip, `"${node.pkg.name}" package`);
        }
      }
    });
  }

  removeTempLicensesOnError(error: any) {
    return Promise.resolve()
      .then(() =>
        removeTempLicenses(this.packagesToBeLicensed ?? []).catch((removeError) => {
          this.logger.error('licenses', 'error removing temporary license files', removeError.stack || removeError);
        })
      )
      .then(() => {
        // restore original error into promise chain
        throw error;
      });
  }

  requestOneTimePassword() {
    if (this.options.dryRun) {
      this.logger.info(c.bold(c.magenta('[dry-run] >')), 'will ask OTP');
      return;
    }

    // if OTP has already been provided, skip prompt
    if (this.otpCache.otp) {
      return;
    }

    return Promise.resolve()
      .then(() => getOneTimePassword('Enter OTP:'))
      .then((otp) => (this.otpCache.otp = otp));
  }

  topoMapPackages(mapper: (pkg: Package) => Promise<any>) {
    return runTopologically(this.packagesToPublish, mapper, {
      concurrency: this.concurrency,
      rejectCycles: this.options.rejectCycles,
      /**
       * Previously `publish` had unique default behavior for graph creation vs other commands: it would only consider dependencies when finding
       * edges by default (i.e. relationships between packages specified via devDependencies would be ignored). It was documented to be the case
       * in order to try and reduce the chance of dependency cycles.
       *
       * We are removing this behavior altogether in v6 because we do not want to have different ways of constructing the graph,
       * only different ways of utilizing it (e.g. --no-sort vs topological sort).
       *
       * Therefore until we remove graphType altogether in v6, we provide a way for users to opt into the old default behavior
       * by setting the `graphType` option to `dependencies`.
       */
      graphType: this.options.graphType === 'dependencies' ? 'dependencies' : 'allDependencies',
      npmClient: this.options.npmClient,
    });
  }

  packUpdated() {
    const tracker = this.logger.newItem('npm pack');
    tracker.addWork(this.packagesToPublish?.length);

    let chain: Promise<any> = Promise.resolve();

    chain = chain.then(() => createTempLicenses(this.project.licensePath, this.packagesToBeLicensed ?? []));

    if (!this.hasRootedLeaf) {
      // despite being deprecated for years...
      chain = chain.then(() => this.runRootLifecycle('prepublish'));

      // these lifecycles _should_ never be employed to run `lerna publish`...
      chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, 'prepare'));
      chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, 'prepublishOnly'));
      chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, 'prepack'));
    }

    const opts = this.conf.snapshot;
    const mapper = pPipe(
      ...(
        [
          (pkg: Package & { packed: Tarball }) =>
            pulseTillDone(packDirectory(pkg, pkg.location, opts, this.options.arboristLoadOptions)).then((packed: Tarball) => {
              tracker.verbose('packed', relative(this.project.rootPath ?? '', pkg.contents));
              tracker.completeWork(1);

              // store metadata for use in this.publishPacked()
              pkg.packed = packed;

              // manifest may be mutated by any previous lifecycle
              return pkg.refresh();
            }),
        ] as UnaryFunction<any, unknown>[]
      ).filter(Boolean)
    );

    chain = chain.then(() => {
      if (this.toposort) {
        return this.topoMapPackages(mapper);
      }
      return pMap(this.packagesToPublish, mapper, { concurrency: this.concurrency });
    });

    chain = chain.then(() => removeTempLicenses(this.packagesToBeLicensed ?? []));

    // remove temporary license files if _any_ error occurs _anywhere_ in the promise chain
    chain = chain.catch((error) => this.removeTempLicensesOnError(error));

    if (!this.hasRootedLeaf) {
      chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, 'postpack'));
    }

    return chain.finally(() => tracker.finish());
  }

  publishPacked() {
    this.publishedPackages = [];
    const tracker = this.logger.newItem('publish');
    tracker.addWork(this.packagesToPublish?.length);

    let chain: Promise<any> = Promise.resolve();

    // if account-level 2FA is enabled, prime the OTP cache
    if (this.twoFactorAuthRequired) {
      chain = chain.then(() => this.requestOneTimePassword());
    }

    const opts = Object.assign(this.conf.snapshot, {
      // distTag defaults to 'latest' OR whatever is in pkg.publishConfig.tag
      // if we skip temp tags we should tag with the proper value immediately
      tag: this.options.tempTag ? 'lerna-temp' : this.conf.get('tag'),
      'git-dry-run': this.options.dryRun || false,
    });

    let queue: Queue | undefined = undefined;
    if (this.options.throttle) {
      const DEFAULT_QUEUE_THROTTLE_SIZE = 25;
      const DEFAULT_QUEUE_THROTTLE_DELAY = 30;
      queue = new TailHeadQueue(
        this.options.throttleSize !== undefined ? this.options.throttleSize : DEFAULT_QUEUE_THROTTLE_SIZE,
        (this.options.throttleDelay !== undefined ? this.options.throttleDelay : DEFAULT_QUEUE_THROTTLE_DELAY) * 1000
      );
    }

    // Set to collect all Provenance transparency log URLs when enabled
    const provenanceUrls = new Map();

    const mapper = async (pkg: Package & { packed: Tarball }) => {
      const preDistTag = this.getPreDistTag(pkg);
      const tag = !this.options.tempTag && preDistTag ? preDistTag : opts.tag;
      const pkgOpts = Object.assign({}, opts, { tag });

      try {
        const publishResult = await pulseTillDone(
          queue
            ? queue.queue(() => npmPublish(pkg, pkg.packed.tarFilePath, pkgOpts, this.otpCache))
            : npmPublish(pkg, pkg.packed.tarFilePath, pkgOpts, this.otpCache)
        );
        this.publishedPackages.push(pkg);

        // Collect provenance URL if present
        if (publishResult?.transparencyLogUrl) {
          provenanceUrls.set(pkg.name, publishResult.transparencyLogUrl);
        }

        tracker.success('published', pkg.name, pkg.version);
        tracker.completeWork(1);

        logPacked(pkg, this.options.dryRun);

        return pkg;
      } catch (err: any) {
        if (err.code === 'EOTP') {
          this.logger.warn('OTP expired, requesting a new OTP...');
          await this.requestOneTimePassword(); // Re-request OTP
          return pulseTillDone(
            queue
              ? queue.queue(() => npmPublish(pkg, pkg.packed.tarFilePath, pkgOpts, this.otpCache))
              : npmPublish(pkg, pkg.packed.tarFilePath, pkgOpts, this.otpCache)
          ); // Retry publish
        }

        const isNpmJsComConflict = isNpmJsPublishVersionConflict(err);
        const isNpmPkgGitHubComConflict = isNpmPkgGitHubPublishVersionConflict(err);

        if (isNpmJsComConflict || isNpmPkgGitHubComConflict) {
          tracker.warn('publish', `Package is already published: ${pkg.name}@${pkg.version}`);
          tracker.completeWork(1);
          return pkg;
        }

        this.logger.silly('', err);
        this.logger.warn('notice', `Package failed to publish: ${pkg.name}`);
        this.logger.error(err.code, (err.body && err.body.error) || err.message);

        // avoid dumping logs, this isn't a lerna problem
        err.name = 'ValidationError';
        // ensure process exits non-zero
        /* v8 ignore next if */
        if ('errno' in err && typeof err.errno === 'number' && Number.isFinite(err.errno)) {
          process.exitCode = err.errno;
        } else {
          this.logger.error('', `errno "${err.errno}" is not a valid exit code - exiting with code 1`);
          process.exitCode = 1;
        }

        throw err;
      }
    };

    chain = chain.then(() => {
      if (this.toposort) {
        return this.topoMapPackages((pkg) => mapper(pkg as Package & { packed: Tarball }));
      }
      return pMap(this.packagesToPublish as (Package & { packed: Tarball })[], mapper, { concurrency: this.concurrency });
    });

    if (!this.hasRootedLeaf) {
      // cyclical 'publish' lifecycles are automatically skipped
      chain = chain.then(() => this.runRootLifecycle('publish'));
      chain = chain.then(() => this.runRootLifecycle('postpublish'));
    }

    return chain.finally(() => {
      // print Provenance URLs if any
      if (provenanceUrls.size > 0) {
        logOutput('The following Provenance transparency log entries were created during publishing:');
        const message = Array.from(provenanceUrls.entries()).map(([pkg, url]) => ` - ${pkg}: ${url}`);
        logOutput(message.join(EOL));
      }
      tracker.finish();
    });
  }

  npmUpdateAsLatest() {
    const tracker = this.logger.newItem('npmUpdateAsLatest');

    tracker.addWork(this.packagesToPublish?.length);
    tracker.showProgress();

    let chain: Promise<any> = Promise.resolve();

    const opts = this.conf.snapshot;
    const getDistTag = (publishConfig) => {
      if (opts.tag === 'latest' && publishConfig?.tag) {
        return publishConfig.tag;
      }
      return opts.tag;
    };
    const mapper = (pkg: Package) => {
      const spec = `${pkg.name}@${pkg.version}`;
      const preDistTag = this.getPreDistTag(pkg);
      const distTag = preDistTag || getDistTag(pkg.get('publishConfig'));

      return Promise.resolve()
        .then(() => pulseTillDone(remove(spec, 'lerna-temp', opts, this.otpCache)))
        .then(() => pulseTillDone(add(spec, distTag, opts, this.otpCache)))
        .then(() => {
          tracker.success('dist-tag', '%s@%s => %j', pkg.name, pkg.version, distTag);
          tracker.completeWork(1);

          return pkg;
        });
    };

    chain = chain.then(() => {
      if (this.toposort) {
        return this.topoMapPackages(mapper);
      }
      return pMap(this.packagesToPublish, mapper, { concurrency: this.concurrency });
    });

    return chain.finally(() => tracker.finish());
  }

  getDistTag() {
    if (this.options.distTag) {
      return this.options.distTag as string;
    }

    if (this.options.canary) {
      return 'canary';
    }

    // undefined defaults to 'latest' OR whatever is in pkg.publishConfig.tag
  }

  getPreDistTag(pkg: Package) {
    if (!this.options.preDistTag) {
      return;
    }
    const isPrerelease = prereleaseIdFromVersion(pkg.version);
    if (isPrerelease) {
      return this.options.preDistTag;
    }
  }

  private getSummaryFilePath(): string {
    /* v8 ignore next if */
    if (this.options.summaryFile === undefined) {
      throw new Error('summaryFile options is not defined. Unable to get path.');
    }

    if (this.options.summaryFile === '') {
      return pathJoin(process.cwd(), './lerna-publish-summary.json');
    }

    const normalizedPath = normalize(this.options.summaryFile);

    /* v8 ignore next if */
    if (normalizedPath === '') {
      throw new Error('summaryFile is not a valid path.');
    }

    if (normalizedPath.endsWith('.json')) {
      return pathJoin(process.cwd(), normalizedPath);
    }

    return pathJoin(process.cwd(), normalizedPath, 'lerna-publish-summary.json');
  }
}
