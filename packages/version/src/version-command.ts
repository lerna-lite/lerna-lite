import chalk from 'chalk';
import dedent from 'dedent';
import minimatch from 'minimatch';
import os from 'os';
import pMap from 'p-map';
import pPipe from 'p-pipe';
import pReduce from 'p-reduce';
import semver from 'semver';

import {
  EOL,
  checkWorkingTree,
  collectPackages,
  collectUpdates,
  Command,
  createRunner,
  logOutput,
  Package,
  promptConfirmation,
  recommendVersion,
  ReleaseClient,
  ReleaseNote,
  runTopologically,
  throwIfUncommitted,
  updateChangelog,
  ValidationError,
} from '@lerna-lite/core';

import { getCurrentBranch } from './lib/get-current-branch';
import { createRelease, createReleaseClient } from './lib/create-release';
import { isAnythingCommitted } from './lib/is-anything-committed';
import { remoteBranchExists } from './lib/remote-branch-exists';
import { isBehindUpstream } from './lib/is-behind-upstream';
import { isBreakingChange } from './lib/is-breaking-change';
import { gitAdd } from './lib/git-add';
import { gitCommit } from './lib/git-commit';
import { gitTag } from './lib/git-tag';
import { gitPush } from './lib/git-push';
import { makePromptVersion } from './lib/prompt-version';
import {
  loadPackageLockFileWhenExists,
  updateClassicLockfileVersion,
  updateTempModernLockfileVersion,
  saveUpdatedLockJsonFile
} from './lib/update-lockfile-version';

export function factory(argv) {
  return new VersionCommand(argv);
}

export class VersionCommand extends Command {
  /** command name */
  name = 'version';

  globalVersion = '';
  packagesToVersion: Package[] = [];
  updatesVersions?: Map<string, string>;
  currentBranch = '';
  gitRemote = '';
  tagPrefix = '';
  commitAndTag = true;
  pushToRemote = true;
  hasRootedLeaf = false;
  releaseClient?: ReleaseClient;
  releaseNotes: ReleaseNote[] = [];
  gitOpts: any;
  runPackageLifecycle: any;
  runRootLifecycle!: (stage: string) => Promise<void> | void;
  savePrefix = '';
  tags: string[] = [];
  updates: any[] = [];

  get otherCommandConfigs(): string[] {
    // back-compat
    return ['publish'];
  }

  get requiresGit() {
    return (
      this.commitAndTag || this.pushToRemote || this.options.allowBranch || this.options.conventionalCommits
    );
  }

  constructor(argv: any) {
    super(argv);
  }

  configureProperties() {
    super.configureProperties();

    // Defaults are necessary here because yargs defaults
    // override durable options provided by a config file
    const {
      amend,
      commitHooks = true,
      gitRemote = 'origin',
      gitTagVersion = true,
      granularPathspec = true,
      push = true,
      signGitCommit,
      signoffGitCommit,
      signGitTag,
      forceGitTag,
      tagVersionPrefix = 'v',
    } = this.options;

    this.gitRemote = gitRemote;
    this.tagPrefix = tagVersionPrefix;
    this.commitAndTag = gitTagVersion;
    this.pushToRemote = gitTagVersion && amend !== true && push;
    // never automatically push to remote when amending a commit

    this.releaseClient = this.pushToRemote && this.options.createRelease && createReleaseClient(this.options.createRelease);
    this.releaseNotes = [];

    if (this.releaseClient && this.options.conventionalCommits !== true) {
      throw new ValidationError('ERELEASE', 'To create a release, you must enable --conventional-commits');
    }

    if (this.releaseClient && this.options.changelog === false) {
      throw new ValidationError('ERELEASE', 'To create a release, you cannot pass --no-changelog');
    }

    this.gitOpts = {
      amend,
      commitHooks,
      granularPathspec,
      signGitCommit,
      signoffGitCommit,
      signGitTag,
      forceGitTag,
    };

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? '' : '^';
  }

  async initialize() {
    if (!this.project.isIndependent()) {
      this.logger.info('current project version', this.project.version ?? '');
    }

    if (this.requiresGit) {
      // git validation, if enabled, should happen before updates are calculated and versions picked
      if (!isAnythingCommitted(this.execOpts, this.options.gitDryRun)) {
        throw new ValidationError(
          'ENOCOMMIT',
          'No commits in this repository. Please commit something before using version.'
        );
      }

      this.currentBranch = getCurrentBranch(this.execOpts, this.options.gitDryRun);

      if (this.currentBranch === 'HEAD') {
        throw new ValidationError(
          'ENOGIT',
          'Detached git HEAD, please checkout a branch to choose versions.'
        );
      }

      if (this.pushToRemote && !remoteBranchExists(this.gitRemote, this.currentBranch, this.execOpts, this.options.gitDryRun)) {
        throw new ValidationError(
          'ENOREMOTEBRANCH',
          dedent`
            Branch "${this.currentBranch}" doesn't exist in remote "${this.gitRemote}".
            If this is a new branch, please make sure you push it to the remote first.
          `
        );
      }

      if (
        this.options.allowBranch &&
        ![].concat(this.options.allowBranch).some((x) => minimatch(this.currentBranch, x))
      ) {
        throw new ValidationError(
          'ENOTALLOWED',
          dedent`
            Branch "${this.currentBranch}" is restricted from versioning due to allowBranch config.
            Please consider the reasons for this restriction before overriding the option.
          `
        );
      }

      if (
        this.commitAndTag &&
        this.pushToRemote &&
        isBehindUpstream(this.gitRemote, this.currentBranch, this.execOpts, this.options.gitDryRun)
      ) {
        // eslint-disable-next-line max-len
        const message = `Local branch "${this.currentBranch}" is behind remote upstream ${this.gitRemote}/${this.currentBranch}`;

        if (!this.options.ci) {
          // interrupt interactive execution
          throw new ValidationError(
            'EBEHIND',
            dedent`
              ${message}
              Please merge remote changes into "${this.currentBranch}" with "git pull"
            `
          );
        }

        // CI execution should not error, but warn & exit
        this.logger.warn('EBEHIND', `${message}, exiting`);

        // still exits zero, aka "ok"
        return false;
      }
    } else {
      this.logger.notice(
        'FYI',
        'git repository validation has been skipped, please ensure your version bumps are correct'
      );
    }

    if (this.options.conventionalPrerelease && this.options.conventionalGraduate) {
      throw new ValidationError(
        'ENOTALLOWED',
        dedent`
          --conventional-prerelease cannot be combined with --conventional-graduate.
        `
      );
    }

    this.updates = collectUpdates(
      this.packageGraph.rawPackageList,
      this.packageGraph,
      this.execOpts,
      this.options
    ).filter((node) => {
      // --no-private completely removes private packages from consideration
      if (node.pkg.private && this.options.private === false) {
        // TODO: (major) make --no-private the default
        return false;
      }

      if (!node.version) {
        // a package may be unversioned only if it is private
        if (node.pkg.private) {
          this.logger.info('version', 'Skipping unversioned private package %j', node.name);
        } else {
          throw new ValidationError(
            'ENOVERSION',
            dedent`
              A version field is required in ${node.name}'s package.json file.
              If you wish to keep the package unversioned, it must be made private.
            `
          );
        }
      }

      return !!node.version;
    });

    if (!this.updates.length) {
      this.logger.success(`No changed packages to ${this.composed ? 'publish' : 'version'}`);

      // still exits zero, aka "ok"
      return false;
    }

    // a "rooted leaf" is the regrettable pattern of adding "." to the "packages" config in lerna.json
    this.hasRootedLeaf = this.packageGraph.has(this.project.manifest.name);

    if (this.hasRootedLeaf && !this.composed) {
      this.logger.info('version', 'rooted leaf detected, skipping synthetic root lifecycles');
    }

    this.runPackageLifecycle = createRunner(this.options);

    // don't execute recursively if run from a poorly-named script
    this.runRootLifecycle = /^(pre|post)?version$/.test(process.env.npm_lifecycle_event as string)
      ? (stage) => {
        this.logger.warn('lifecycle', 'Skipping root %j because it has already been called', stage);
      }
      : (stage) => this.runPackageLifecycle(this.project.manifest, stage);

    // amending a commit probably means the working tree is dirty
    if (this.commitAndTag && this.gitOpts.amend !== true) {
      const { forcePublish, conventionalCommits, conventionalGraduate } = this.options;
      const checkUncommittedOnly = forcePublish || (conventionalCommits && conventionalGraduate);
      const check = checkUncommittedOnly ? throwIfUncommitted : checkWorkingTree;
      await check(this.execOpts, this.options.gitDryRun);
    } else {
      this.logger.warn('version', 'Skipping working tree validation, proceed at your own risk');
    }

    const versionsForUpdate = await this.getVersionsForUpdates();
    await this.setUpdatesForVersions(versionsForUpdate);
    return this.confirmVersions();
  }

  async execute() {
    await this.updatePackageVersions();

    if (this.commitAndTag) {
      await this.commitAndTagUpdates();
    } else {
      this.logger.info('execute', 'Skipping git tag/commit');
    }

    if (this.pushToRemote) {
      await this.gitPushToRemote();
    } else {
      this.logger.info('execute', 'Skipping git push');
    }

    if (this.releaseClient) {
      this.logger.info('execute', 'Creating releases...');
      await createRelease(
        this.releaseClient,
        { tags: this.tags, releaseNotes: this.releaseNotes },
        { gitRemote: this.options.gitRemote, execOpts: this.execOpts },
        this.options.gitDryRun
      );
    } else {
      this.logger.info('execute', 'Skipping releases');
    }

    if (!this.composed) {
      this.logger.success('version', 'finished');
    }

    return {
      updates: this.updates,
      updatesVersions: this.updatesVersions,
    };
  }

  getVersionsForUpdates() {
    const independentVersions = this.project.isIndependent();
    const { bump, conventionalCommits, preid } = this.options;
    const repoVersion = bump ? semver.clean(bump) : '';
    const increment = bump && !semver.valid(bump) ? bump : '';

    const resolvePrereleaseId = (existingPreid) => preid || existingPreid || 'alpha';

    const makeGlobalVersionPredicate = (nextVersion) => {
      this.globalVersion = nextVersion;

      return () => nextVersion;
    };

    // decide the predicate in the conditionals below
    let predicate;

    if (repoVersion) {
      predicate = makeGlobalVersionPredicate(repoVersion);
    } else if (increment && independentVersions) {
      // compute potential prerelease ID for each independent update
      predicate = (node) => semver.inc(node.version, increment, resolvePrereleaseId(node.prereleaseId));
    } else if (increment) {
      // compute potential prerelease ID once for all fixed updates
      const prereleaseId = prereleaseIdFromVersion(this.project.version);
      const nextVersion = semver.inc(this.project.version, increment, resolvePrereleaseId(prereleaseId));

      predicate = makeGlobalVersionPredicate(nextVersion);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions(resolvePrereleaseId);
    } else if (independentVersions) {
      // prompt for each independent update with potential prerelease ID
      predicate = makePromptVersion(resolvePrereleaseId);
    } else {
      // prompt once with potential prerelease ID
      const prereleaseId = prereleaseIdFromVersion(this.project.version);
      const node = { version: this.project.version, prereleaseId };

      predicate = makePromptVersion(resolvePrereleaseId);
      predicate = predicate(node).then(makeGlobalVersionPredicate);
    }

    return Promise.resolve(predicate).then((getVersion) => this.reduceVersions(getVersion));
  }

  reduceVersions(getVersion) {
    const iterator = (versionMap, node) =>
      Promise.resolve(getVersion(node)).then((version) => versionMap.set(node.name, version));

    return pReduce(this.updates, iterator, new Map());
  }

  setUpdatesForVersions(versions: Map<string, string>) {
    if (this.project.isIndependent()) {
      // only partial fixed versions need to be checked
      this.updatesVersions = versions;
    } else {
      let hasBreakingChange;

      for (const [name, bump] of versions) {
        hasBreakingChange = hasBreakingChange || isBreakingChange(this.packageGraph?.get(name).version, bump);
      }

      if (hasBreakingChange) {
        // _all_ packages need a major version bump whenever _any_ package does
        this.updates = Array.from(this.packageGraph?.values() ?? []);

        // --no-private completely removes private packages from consideration
        if (this.options.private === false) {
          // TODO: (major) make --no-private the default
          this.updates = this.updates.filter((node) => !node.pkg.private);
        }

        this.updatesVersions = new Map(this.updates.map((node) => [node.name, this.globalVersion]));
      } else {
        this.updatesVersions = versions;
      }
    }

    this.packagesToVersion = this.updates.map((node) => node.pkg);
  }

  getPrereleasePackageNames() {
    const prereleasePackageNames = this.getPackagesForOption(this.options.conventionalPrerelease);
    const isCandidate = prereleasePackageNames.has('*')
      ? () => true
      : (_node, name) => prereleasePackageNames.has(name);

    return collectPackages(this.packageGraph, { isCandidate }).map((pkg) => pkg?.name ?? '');
  }

  /**
   * @param {boolean|string|string[]} option
   * @returns {Set<string>} A set of package names (or wildcard) derived from option value.
   */
  getPackagesForOption(option: boolean | string | string[]) {
    // new Set(null) is equivalent to new Set([])
    // i.e., an empty Set
    let inputs: string[] | null = null;

    if (option === true) {
      // option passed without specific packages, eg. --force-publish
      inputs = ['*'];
    } else if (typeof option === 'string') {
      // option passed with one or more comma separated package names, eg.:
      // --force-publish=*
      // --force-publish=foo
      // --force-publish=foo,bar
      inputs = option.split(',');
    } else if (Array.isArray(option)) {
      // option passed multiple times with individual package names
      // --force-publish foo --force-publish baz
      inputs = [...option];
    }

    return new Set(inputs);
  }

  async recommendVersions(resolvePrereleaseId) {
    const independentVersions = this.project.isIndependent();
    const { changelogPreset, conventionalGraduate } = this.options;
    const rootPath = this.project.manifest.location;
    const type = independentVersions ? 'independent' : 'fixed';
    const prereleasePackageNames = this.getPrereleasePackageNames();
    const graduatePackageNames = Array.from(this.getPackagesForOption(conventionalGraduate));
    const shouldPrerelease = (name) => prereleasePackageNames?.includes(name);
    const shouldGraduate = (name) => graduatePackageNames.includes('*') || graduatePackageNames.includes(name);
    const getPrereleaseId = (node) => {
      if (!shouldGraduate(node.name) && (shouldPrerelease(node.name) || node.prereleaseId)) {
        return resolvePrereleaseId(node.prereleaseId);
      }
    };

    if (type === 'fixed') {
      this.setGlobalVersionFloor();
    }

    const versions: Map<string, string> = await this.reduceVersions((node) =>
      recommendVersion(node, type, {
        changelogPreset,
        rootPath,
        tagPrefix: this.tagPrefix,
        prereleaseId: getPrereleaseId(node),
      })
    );

    if (type === 'fixed') {
      this.globalVersion = this.setGlobalVersionCeiling(versions) ?? '';
    }

    return versions;
  }

  confirmVersions(): Promise<boolean> | boolean {
    const changes = this.packagesToVersion.map((pkg) => {
      let line = ` - ${pkg.name ?? '[n/a]'}: ${pkg.version} => ${chalk.cyan(this.updatesVersions?.get(pkg?.name ?? ''))}`;
      if (pkg.private) {
        line += ` (${chalk.red('private')})`;
      }
      return line;
    });

    logOutput('');
    logOutput(`Changes (${changes.length} packages):`);
    logOutput(changes.join(EOL));
    logOutput('');

    if (this.options.yes) {
      this.logger.info('auto-confirmed', '');
      return true;
    }

    // When composed from `lerna publish`, use this opportunity to confirm publishing
    const message = this.composed
      ? 'Are you sure you want to publish these packages?'
      : 'Are you sure you want to create these versions?';

    return promptConfirmation(message);
  }

  updatePackageVersions() {
    const { conventionalCommits, changelogPreset, changelog = true } = this.options;
    const independentVersions = this.project.isIndependent();
    const rootPath = this.project.manifest.location;
    const changedFiles = new Set();

    let chain: Promise<any> = Promise.resolve();

    // preversion:  Run BEFORE bumping the package version.
    // version:     Run AFTER bumping the package version, but BEFORE commit.
    // postversion: Run AFTER bumping the package version, and AFTER commit.
    // @see https://docs.npmjs.com/misc/scripts

    if (!this.hasRootedLeaf) {
      // exec preversion lifecycle in root (before all updates)
      chain = chain.then(() => this.runRootLifecycle('preversion'));
    }

    const actions = [
      (pkg) => this.runPackageLifecycle(pkg, 'preversion').then(() => pkg),
      // manifest may be mutated by any previous lifecycle
      (pkg) => pkg.refresh(),
      (pkg) => {
        // set new version
        pkg.set('version', this.updatesVersions?.get(pkg?.name ?? ''));

        // update pkg dependencies
        for (const [depName, resolved] of this.packageGraph?.get(pkg.name).localDependencies) {
          const depVersion = this.updatesVersions?.get(depName);

          if (depVersion && resolved.type !== 'directory') {
            // don't overwrite local file: specifiers, they only change during publish
            pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
          }
        }

        return Promise.all([
          updateClassicLockfileVersion(pkg),
          pkg.serialize()
        ]).then(([lockfilePath]) => {
          // commit the updated manifest
          changedFiles.add(pkg.manifestLocation);

          if (lockfilePath) {
            changedFiles.add(lockfilePath);
          }

          return pkg;
        });
      },
      (pkg) => this.runPackageLifecycle(pkg, 'version').then(() => pkg),
    ];

    if (conventionalCommits && changelog) {
      // we can now generate the Changelog, based on the
      // the updated version that we're about to release.
      const type = independentVersions ? 'independent' : 'fixed';

      actions.push((pkg) =>
        updateChangelog(pkg, type, {
          changelogPreset,
          rootPath,
          tagPrefix: this.tagPrefix,
          changelogHeaderMessage: this.options.changelogHeaderMessage,
          changelogVersionMessage: this.options.changelogVersionMessage,
        }).then(({ logPath, newEntry }) => {
          // commit the updated changelog
          changedFiles.add(logPath);

          // add release notes
          if (independentVersions) {
            this.releaseNotes.push({
              name: pkg.name,
              notes: newEntry,
            });
          }

          return pkg;
        })
      );
    }

    const mapUpdate = pPipe(...actions);

    chain = chain.then(() =>
      runTopologically(this.packagesToVersion, mapUpdate, {
        concurrency: this.concurrency,
        rejectCycles: this.options.rejectCycles,
      })
    );

    chain = chain.then(() => {
      // update modern lockfile (version 2 or higher) when exist in the project root
      loadPackageLockFileWhenExists(rootPath)
        .then(lockFileResponse => {
          if (lockFileResponse && lockFileResponse.lockfileVersion >= 2) {
            for (const pkg of this.packagesToVersion) {
              this.logger.silly(`lock`, `updating root "package-lock-json" for package "${pkg.name}"`);
              updateTempModernLockfileVersion(pkg, lockFileResponse.json);
            }

            // save the lockfile, only once, after all package versions were updated
            saveUpdatedLockJsonFile(lockFileResponse.path, lockFileResponse.json)
              .then((lockfilePath) => {
                if (lockfilePath) {
                  changedFiles.add(lockfilePath);
                }
              });
          }
        });
    });

    if (!independentVersions) {
      this.project.version = this.globalVersion;

      if (conventionalCommits && changelog) {
        chain = chain.then(() =>
          updateChangelog(this.project.manifest, 'root', {
            changelogPreset,
            rootPath,
            tagPrefix: this.tagPrefix,
            version: this.globalVersion,
            changelogHeaderMessage: this.options.changelogHeaderMessage,
            changelogVersionMessage: this.options.changelogVersionMessage,
          }).then(({ logPath, newEntry }) => {
            // commit the updated changelog
            changedFiles.add(logPath);

            // add release notes
            this.releaseNotes.push({
              name: 'fixed',
              notes: newEntry,
            });
          })
        );
      }

      chain = chain.then(() =>
        this.project.serializeConfig().then((lernaConfigLocation) => {
          // commit the version update
          changedFiles.add(lernaConfigLocation);
        })
      );
    }

    if (!this.hasRootedLeaf) {
      // exec version lifecycle in root (after all updates)
      chain = chain.then(() => this.runRootLifecycle('version'));
    }

    if (this.commitAndTag) {
      chain = chain.then(() => gitAdd(Array.from(changedFiles), this.gitOpts, this.execOpts, this.options.gitDryRun));
    }

    return chain;
  }


  async commitAndTagUpdates() {
    if (this.project.isIndependent()) {
      this.tags = await this.gitCommitAndTagVersionForUpdates();
    } else {
      this.tags = await this.gitCommitAndTagVersion();
    }

    // run the postversion script for each update
    await pMap(this.packagesToVersion, (pkg) => this.runPackageLifecycle(pkg, 'postversion'));

    if (!this.hasRootedLeaf) {
      // run postversion, if set, in the root directory
      await this.runRootLifecycle('postversion');
    }
  }

  async gitCommitAndTagVersionForUpdates() {
    const tags = this.packagesToVersion.map((pkg) => `${pkg.name}@${this.updatesVersions?.get(pkg.name)}`);
    const subject = this.options.message || 'Publish';
    const message = tags.reduce((msg, tag) => `${msg}${os.EOL} - ${tag}`, `${subject}${os.EOL}`);

    await gitCommit(message, this.gitOpts, this.execOpts, this.options.gitDryRun);
    await Promise.all(tags.map((tag) => gitTag(tag, this.gitOpts, this.execOpts, this.options.gitDryRun)));

    return tags;
  }

  async gitCommitAndTagVersion() {
    const version = this.globalVersion;
    const tag = `${this.tagPrefix}${version}`;
    const message = this.options.message
      ? this.options.message.replace(/%s/g, tag).replace(/%v/g, version)
      : tag;

    await gitCommit(message, this.gitOpts, this.execOpts, this.options.gitDryRun);
    await gitTag(tag, this.gitOpts, this.execOpts, this.options.gitDryRun);

    return [tag];
  }

  gitPushToRemote() {
    this.logger.info('git', 'Pushing tags...');

    return gitPush(this.gitRemote, this.currentBranch, this.execOpts, this.options.gitDryRun);
  }

  setGlobalVersionFloor() {
    const globalVersion = this.project.version;

    for (const node of this.updates) {
      if (semver.lt(node.version, globalVersion)) {
        this.logger.verbose(
          'version',
          `Overriding version of ${node.name} from ${node.version} to ${globalVersion}`
        );

        node.pkg.version = globalVersion;
      }
    }
  }

  setGlobalVersionCeiling(versions) {
    let highestVersion = this.project.version;

    versions.forEach((bump) => {
      if (bump && semver.gt(bump, highestVersion)) {
        highestVersion = bump;
      }
    });

    versions.forEach((_, name) => versions.set(name, highestVersion));

    return highestVersion;
  }
}

/**
 * @param {string} version
 * @returns {string|undefined}
 */
function prereleaseIdFromVersion(version) {
  return ((semver.prerelease(version) || []) as string[]).shift();
}
