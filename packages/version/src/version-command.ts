import dedent from 'dedent';
import { minimatch } from 'minimatch';
import { EOL as OS_EOL } from 'node:os';
import pLimit from 'p-limit';
import pMap from 'p-map';
import pPipe from 'p-pipe';
import pReduce from 'p-reduce';
import semver from 'semver';
import c from 'tinyrainbow';

import {
  EOL,
  type ChangelogPresetOptions,
  checkWorkingTree,
  collectPackages,
  collectUpdates,
  Command,
  type CommandType,
  createRunner,
  logOutput,
  type Package,
  type PackageGraphNode,
  type ProjectConfig,
  promptConfirmation,
  runTopologically,
  throwIfUncommitted,
  type UpdateCollectorOptions,
  ValidationError,
  type VersionCommandOption,
} from '@lerna-lite/core';

import { getCurrentBranch } from './lib/get-current-branch.js';
import { createRelease, createReleaseClient } from './lib/create-release.js';
import { isAnythingCommitted } from './lib/is-anything-committed.js';
import { remoteBranchExists } from './lib/remote-branch-exists.js';
import { isBehindUpstream } from './lib/is-behind-upstream.js';
import { isBreakingChange } from './lib/is-breaking-change.js';
import { gitAdd } from './lib/git-add.js';
import { gitCommit } from './lib/git-commit.js';
import { gitTag } from './lib/git-tag.js';
import { gitPush, gitPushSingleTag } from './lib/git-push.js';
import { makePromptVersion } from './lib/prompt-version.js';
import {
  loadPackageLockFileWhenExists,
  updateClassicLockfileVersion,
  updateTempModernLockfileVersion,
  runInstallLockFileOnly,
  saveUpdatedLockJsonFile,
} from './lib/update-lockfile-version.js';
import type { GitCreateReleaseClientOutput, ReleaseNote, RemoteCommit } from './interfaces.js';
import { applyBuildMetadata } from './conventional-commits/apply-build-metadata.js';
import { getCommitsSinceLastRelease } from './conventional-commits/get-commits-since-last-release.js';
import { recommendVersion } from './conventional-commits/recommend-version.js';
import { updateChangelog } from './conventional-commits/update-changelog.js';

export function factory(argv: VersionCommandOption) {
  return new VersionCommand(argv);
}

export class VersionCommand extends Command<VersionCommandOption> {
  /** command name */
  name = 'version' as CommandType;

  globalVersion = '';
  changelogIncludeCommitsClientLogin?: boolean | string;
  changelogIncludeCommitsGitAuthor?: boolean | string;
  commitsSinceLastRelease?: RemoteCommit[];
  currentBranch = '';
  gitRemote = '';
  tagPrefix = '';
  commitAndTag = true;
  pushToRemote = true;
  hasRootedLeaf = false;
  releaseClient?: GitCreateReleaseClientOutput;
  releaseNotes: ReleaseNote[] = [];
  gitOpts: any;
  runPackageLifecycle: any;
  runRootLifecycle!: (stage: string) => Promise<void> | void;
  savePrefix = '';
  tags: string[] = [];
  packagesToVersion: Package[] = [];
  updates: PackageGraphNode[] = [];
  updatesVersions?: Map<string, string>;
  premajorVersionBump?: 'default' | 'force-patch';

  get otherCommandConfigs(): string[] {
    // back-compat
    return ['publish'];
  }

  get requiresGit(): boolean {
    // prettier-ignore
    return (
      this.commitAndTag ||
      this.pushToRemote ||
      this.options.allowBranch ||
      this.options.conventionalCommits
    ) as boolean;
  }

  constructor(argv: VersionCommandOption | ProjectConfig) {
    super(argv);
  }

  async configureProperties() {
    super.configureProperties();

    // Defaults are necessary here because yargs defaults
    // override durable options provided by a config file
    const {
      amend,
      changelogIncludeCommitsClientLogin,
      changelogIncludeCommitsGitAuthor,
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
      premajorVersionBump = 'default',
      message,
    } = this.options;

    this.gitRemote = gitRemote;
    this.tagPrefix = tagVersionPrefix;
    this.commitAndTag = gitTagVersion;
    this.pushToRemote = gitTagVersion && amend !== true && push;
    const overrideMessage = amend && !!message;
    this.changelogIncludeCommitsClientLogin =
      changelogIncludeCommitsClientLogin === '' ? true : changelogIncludeCommitsClientLogin;
    this.changelogIncludeCommitsGitAuthor = changelogIncludeCommitsGitAuthor === '' ? true : changelogIncludeCommitsGitAuthor;
    this.premajorVersionBump = premajorVersionBump;
    // never automatically push to remote when amending a commit

    if (this.pushToRemote && this.options.createRelease) {
      this.releaseClient = await createReleaseClient(this.options.createRelease);
    }
    this.releaseNotes = [];

    if (this.releaseClient && this.options.conventionalCommits !== true) {
      throw new ValidationError('ERELEASE', 'To create a release, you must enable --conventional-commits');
    }

    if (this.options.generateReleaseNotes && !this.options.createRelease) {
      throw new ValidationError('ERELEASE', 'To generate release notes, you must define --create-release');
    }

    if (this.options.createReleaseDiscussion && !this.options.createRelease) {
      throw new ValidationError('ERELEASE', 'To create a release discussion, you must define --create-release');
    }

    if (this.options.createReleaseDiscussion !== undefined && !this.options.createReleaseDiscussion) {
      throw new ValidationError(
        'ERELEASE',
        'A discussion category name must be provided to the --create-release-discussion option.'
      );
    }

    if (
      this.options.conventionalCommits &&
      typeof this.options.changelogPreset === 'object' &&
      (this.options.changelogPreset as ChangelogPresetOptions)?.releaseCommitMessageFormat
    ) {
      throw new ValidationError(
        'ENOTSUPPORTED',
        'The Lerna config "changelogPreset.releaseCommitMessageFormat" is not supported, you should simply use "version.message" instead which will give you the same end result.'
      );
    }

    this.gitOpts = {
      amend,
      commitHooks,
      granularPathspec,
      overrideMessage,
      signGitCommit,
      signoffGitCommit,
      signGitTag,
      forceGitTag,
    };

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? '' : '^';
  }

  async initialize() {
    if (this.releaseClient && this.options.changelog === false && this.options.generateReleaseNotes !== true) {
      const msg = 'To create a release, you cannot pass --no-changelog';
      if (!this.options.dryRun) {
        throw new ValidationError('ERELEASE', msg);
      }
      this.logger.warn('ERELEASE', msg);
    }

    const isIndependent = this.project.isIndependent();
    const describeTag = this.options.describeTag;

    if (!isIndependent) {
      this.logger.info('current project version', this.project.version ?? '');
    }

    if (this.requiresGit) {
      // git validation, if enabled, should happen before updates are calculated and versions picked
      if (!isAnythingCommitted(this.execOpts, this.options.dryRun)) {
        throw new ValidationError('ENOCOMMIT', 'No commits in this repository. Please commit something before using version.');
      }

      this.currentBranch = getCurrentBranch(this.execOpts, false);

      if (this.currentBranch === 'HEAD') {
        throw new ValidationError('ENOGIT', 'Detached git HEAD, please checkout a branch to choose versions.');
      }

      if (this.pushToRemote && !remoteBranchExists(this.gitRemote, this.currentBranch, this.execOpts, this.options.dryRun)) {
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
        !([] as string[]).concat(this.options.allowBranch).some((x) => minimatch(this.currentBranch, x))
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
        isBehindUpstream(this.gitRemote, this.currentBranch, this.execOpts, this.options.dryRun)
      ) {
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
      this.logger.notice('FYI', 'git repository validation has been skipped, please ensure your version bumps are correct');
    }

    if (this.options.conventionalPrerelease && this.options.conventionalGraduate) {
      throw new ValidationError(
        'ENOTALLOWED',
        dedent`
          --conventional-prerelease cannot be combined with --conventional-graduate.
        `
      );
    }

    if (this.options.manuallyUpdateRootLockfile && this.options.syncWorkspaceLock) {
      throw new ValidationError(
        'ENOTALLOWED',
        dedent`
          --manually-update-root-lockfile cannot be combined with --sync-workspace-lock.
        `
      );
    }

    if (this.changelogIncludeCommitsClientLogin && this.changelogIncludeCommitsGitAuthor) {
      throw new ValidationError(
        'ENOTALLOWED',
        dedent`
          --changelog-include-commits-client-login cannot be combined with --changelog-include-commits-git-author.
        `
      );
    }

    // fetch all commits from remote server of the last release when user wants to include client login associated to each commits
    const remoteClient = this.options.createRelease || this.options.remoteClient;
    if (this.options.conventionalCommits && this.changelogIncludeCommitsClientLogin) {
      if (!remoteClient) {
        throw new ValidationError(
          'EMISSINGCLIENT',
          dedent`
            --changelog-include-commits-client-login requires one of these two option --remote-client or --create-release to be defined.
          `
        );
      }

      this.commitsSinceLastRelease = await getCommitsSinceLastRelease(
        remoteClient,
        this.options.gitRemote,
        this.currentBranch,
        isIndependent,
        this.execOpts
      );
    }

    this.updates = collectUpdates(this.packageGraph.rawPackageList, this.packageGraph, this.execOpts, {
      ...this.options,
      isIndependent,
      describeTag,
    } as UpdateCollectorOptions).filter((node) => {
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

    this.runPackageLifecycle = createRunner({ ...this.options, stdio: 'inherit' });

    // don't execute recursively if run from a poorly-named script
    this.runRootLifecycle = /^(pre|post)?version$/.test(process.env.npm_lifecycle_event as string)
      ? (stage) => this.logger.warn('lifecycle', 'Skipping root %j because it has already been called', stage)
      : (stage) => this.runPackageLifecycle(this.project.manifest, stage);

    // amending a commit probably means the working tree is dirty
    if (this.commitAndTag && this.gitOpts.amend !== true) {
      const { forcePublish, conventionalCommits, conventionalGraduate } = this.options;
      const checkUncommittedOnly = forcePublish || (conventionalCommits && conventionalGraduate);
      const check = checkUncommittedOnly ? throwIfUncommitted : checkWorkingTree;
      await check(this.execOpts, this.options.dryRun);
    } else {
      this.logger.warn('version', 'Skipping working tree validation, proceed at your own risk');
    }

    const versionsForUpdate = await this.getVersionsForUpdates();
    this.setUpdatesForVersions(versionsForUpdate);
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
      try {
        await createRelease(
          {
            client: this.releaseClient,
            type: this.options.createRelease!,
            generateReleaseNotes: this.options.generateReleaseNotes,
            releaseDiscussion: this.options.createReleaseDiscussion,
          },
          {
            tags: this.tags,
            tagVersionSeparator: this.options.tagVersionSeparator || '@',
            releaseNotes: this.releaseNotes,
          },
          {
            gitRemote: this.options.gitRemote,
            execOpts: this.execOpts,
            skipBumpOnlyReleases: this.options.skipBumpOnlyReleases,
          },
          this.options.dryRun
        );
      } catch (err: any) {
        this.logger.error(
          'ERELEASE',
          `Something went wrong when creating the ${this.options.createRelease} release. Error:: ${err?.message ?? err}`
        );
      }
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
    const repoVersion = (bump ? semver.clean(bump) : '') as string;
    const increment = (bump && !semver.valid(bump) ? bump : '') as semver.ReleaseType;

    const resolvePrereleaseId = (existingPreid?: string) => preid || existingPreid || 'alpha';

    const makeGlobalVersionPredicate = (nextVersion: string) => {
      this.globalVersion = nextVersion;

      return () => nextVersion;
    };

    // decide the predicate in the conditionals below
    let predicate: (s: any) => any;

    if (repoVersion) {
      predicate = makeGlobalVersionPredicate(applyBuildMetadata(repoVersion, this.options.buildMetadata));
    } else if (increment && independentVersions) {
      // compute potential prerelease ID for each independent update
      predicate = (node: { version: string; prereleaseId: string }) =>
        applyBuildMetadata(
          semver.inc(node.version, increment, resolvePrereleaseId(node.prereleaseId)),
          this.options.buildMetadata
        );
    } else if (increment) {
      // compute potential prerelease ID once for all fixed updates
      const prereleaseId = prereleaseIdFromVersion(this.project.version);
      const nextVersion = applyBuildMetadata(
        semver.inc(this.project.version, increment, resolvePrereleaseId(prereleaseId)),
        this.options.buildMetadata
      );

      predicate = makeGlobalVersionPredicate(nextVersion as string);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions(resolvePrereleaseId);
    } else if (independentVersions) {
      // prompt for each independent update with potential prerelease ID
      predicate = makePromptVersion(resolvePrereleaseId, this.options.buildMetadata);
    } else {
      // prompt once with potential prerelease ID
      const prereleaseId = prereleaseIdFromVersion(this.project.version);
      const node = { version: this.project.version, prereleaseId };

      predicate = makePromptVersion(resolvePrereleaseId, this.options.buildMetadata);
      predicate = predicate(node).then(makeGlobalVersionPredicate);
    }

    return Promise.resolve(predicate).then((getVersion: (s: PackageGraphNode) => string) => this.reduceVersions(getVersion));
  }

  reduceVersions(getVersion: (s: PackageGraphNode) => string) {
    const iterator = (versionMap: Map<string, string>, node: PackageGraphNode) =>
      Promise.resolve(getVersion(node)).then((version: string) => versionMap.set(node.name, version));

    return pReduce(this.updates, iterator, new Map());
  }

  setUpdatesForVersions(versions: Map<string, string>) {
    if (this.project.isIndependent()) {
      // only partial fixed versions need to be checked
      this.updatesVersions = versions;
    } else {
      let hasBreakingChange = false;

      for (const [name, bump] of versions) {
        hasBreakingChange = hasBreakingChange || isBreakingChange(this.packageGraph?.get(name)!.version, bump);
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
    // prettier-ignore
    const isCandidate = prereleasePackageNames.has('*')
      ? () => true
      : (_node, name) => prereleasePackageNames.has(name);

    const prePkgs = collectPackages(this.packageGraph, { isCandidate }).map((pkg) => pkg?.name ?? '');

    if (
      this.options.conventionalPrerelease !== undefined &&
      typeof this.options.conventionalPrerelease !== 'boolean' &&
      prePkgs.length === 0
    ) {
      throw new ValidationError(
        'ENOPRERELEASE',
        `No packages found to prerelease when using "--conventional-prerelease ${this.options.conventionalPrerelease}".`
      );
    }

    return prePkgs;
  }

  /**
   * @param {boolean|string|string[]} option
   * @returns {Set<string>} A set of package names (or wildcard) derived from option value.
   */
  getPackagesForOption(option?: boolean | string | string[]) {
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
    const { buildMetadata, changelogPreset, conventionalGraduate, conventionalBumpPrerelease } = this.options;
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

    const versions: Map<string, string> = await this.reduceVersions(
      (node) =>
        recommendVersion(
          node,
          type,
          {
            changelogPreset,
            rootPath,
            tagPrefix: this.tagPrefix,
            prereleaseId: getPrereleaseId(node),
            conventionalBumpPrerelease,
            buildMetadata,
          },
          this.premajorVersionBump
        ) as any
    );

    if (type === 'fixed') {
      this.globalVersion = this.setGlobalVersionCeiling(versions) ?? '';
    }

    return versions;
  }

  confirmVersions(): Promise<boolean> | boolean {
    const changes = this.packagesToVersion.map((pkg) => {
      let line = ` - ${pkg.name ?? '[n/a]'}: ${pkg.version} => ${c.cyan(this.updatesVersions?.get(pkg?.name ?? ''))}`;
      if (pkg.private) {
        line += ` (${c.red('private')})`;
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
    let confirmMessage = this.options.dryRun ? c.bgMagenta('[dry-run]') : '';
    confirmMessage += this.composed
      ? ' Are you sure you want to publish these packages?'
      : ' Are you sure you want to create these versions?';

    return promptConfirmation(confirmMessage.trim());
  }

  updatePackageVersions() {
    const { conventionalCommits, changelogPreset, changelogHeaderMessage, changelog = true } = this.options;
    const independentVersions = this.project.isIndependent();
    const rootPath = this.project.manifest.location;
    const changedFiles = new Set<string>();
    const npmClient = this.options.npmClient || 'npm';

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
      (pkg: Package) => this.runPackageLifecycle(pkg, 'preversion').then(() => pkg),
      // manifest may be mutated by any previous lifecycle
      (pkg: Package) => pkg.refresh(),
      (pkg: Package) => {
        // set new version
        pkg.set('version', this.updatesVersions?.get(pkg?.name ?? ''));

        // update pkg dependencies
        for (const [depName, resolved] of this.packageGraph?.get(pkg.name)!.localDependencies) {
          const depVersion = this.updatesVersions?.get(depName);

          if (depVersion && resolved.type !== 'directory') {
            // don't overwrite local file: specifiers, they only change during publish
            pkg.updateLocalDependency(
              resolved,
              depVersion,
              this.savePrefix,
              this.options.allowPeerDependenciesUpdate,
              this.commandName
            );
          }
        }

        return Promise.all([updateClassicLockfileVersion(pkg), pkg.serialize()]).then(([lockfilePath]) => {
          // commit the updated manifest
          changedFiles.add(pkg.manifestLocation);

          if (lockfilePath) {
            changedFiles.add(lockfilePath);
          }

          return pkg;
        });
      },
      (pkg: Package) => this.runPackageLifecycle(pkg, 'version').then(() => pkg),
    ];

    if (conventionalCommits && changelog) {
      // we can now generate the Changelog, based on the
      // the updated version that we're about to release.
      const type = independentVersions ? 'independent' : 'fixed';

      actions.push((pkg: Package) =>
        updateChangelog(pkg, type, {
          changelogPreset,
          rootPath,
          tagPrefix: this.tagPrefix,
          changelogIncludeCommitsGitAuthor: this.changelogIncludeCommitsGitAuthor,
          changelogIncludeCommitsClientLogin: this.changelogIncludeCommitsClientLogin,
          changelogHeaderMessage,
          commitsSinceLastRelease: this.commitsSinceLastRelease,
        }).then(({ logPath, newEntry }) => {
          // commit the updated changelog
          changedFiles.add(logPath);

          // add release notes
          if (independentVersions) {
            this.releaseNotes.push({
              name: pkg.name,
              notes: newEntry,
              pkg,
            });
          }

          return pkg;
        })
      );
    } else if (this.options.generateReleaseNotes && !changelog) {
      actions.push((pkg: Package) => {
        this.releaseNotes.push({
          name: pkg.name,
          pkg,
        });
      });
    }

    const mapUpdate = pPipe(...actions);

    chain = chain.then(() =>
      runTopologically(this.packagesToVersion, mapUpdate, {
        concurrency: this.concurrency,
        rejectCycles: this.options.rejectCycles,
        graphType: 'allDependencies',
      })
    );

    // update the project root npm lock file, we will read and write back to the lock file
    // this is currently the default update and if none of the flag are enabled (or all undefined) then we'll consider this as enabled
    if (
      npmClient === 'npm' &&
      (this.options.manuallyUpdateRootLockfile ||
        (this.options.manuallyUpdateRootLockfile === undefined && !this.options.syncWorkspaceLock))
    ) {
      this.logger.warn(
        'npm',
        'we recommend using --sync-workspace-lock which will sync your lock file via your favorite npm client instead of relying on Lerna-Lite itself to update it.'
      );

      chain = chain.then(() =>
        // update modern lockfile (version 2 or higher) when exist in the project root
        loadPackageLockFileWhenExists(rootPath).then((lockFileResponse) => {
          if (lockFileResponse && lockFileResponse.lockfileVersion >= 2) {
            this.logger.verbose(`lock`, `start process loop of manually updating npm lock file`);

            for (const pkg of this.packagesToVersion) {
              this.logger.verbose(`lock`, `updating root "package-lock-json" for package "${pkg.name}"`);
              updateTempModernLockfileVersion(pkg, lockFileResponse.json);
            }

            // save the lockfile, only once, after all package versions were updated
            return saveUpdatedLockJsonFile(lockFileResponse.path, lockFileResponse.json).then((lockfilePath) => {
              if (lockfilePath) {
                changedFiles.add(lockfilePath);
              }
            });
          }
        })
      );
    } else if (this.options.syncWorkspaceLock) {
      // update lock file, with npm client defined when `--sync-workspace-lock` is enabled
      chain = chain.then(() =>
        runInstallLockFileOnly(npmClient, this.project.manifest.location, {
          npmClientArgs: this.options.npmClientArgs || [],
          runScriptsOnLockfileUpdate: this.options.runScriptsOnLockfileUpdate,
        }).then((lockfilePath) => {
          if (lockfilePath) {
            changedFiles.add(lockfilePath);
          }
        })
      );
    }

    if (!independentVersions) {
      this.project.version = this.globalVersion;

      if (conventionalCommits && changelog) {
        chain = chain.then(() =>
          updateChangelog(this.project.manifest, 'root', {
            changelogPreset,
            rootPath,
            tagPrefix: this.tagPrefix,
            version: this.globalVersion,
            changelogIncludeCommitsGitAuthor: this.changelogIncludeCommitsGitAuthor,
            changelogIncludeCommitsClientLogin: this.changelogIncludeCommitsClientLogin,
            changelogHeaderMessage,
            commitsSinceLastRelease: this.commitsSinceLastRelease,
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
      } else if (this.options.generateReleaseNotes && !changelog) {
        chain.then(() => {
          this.releaseNotes.push({
            name: 'fixed',
          });
        });
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
      chain = chain.then(() => gitAdd(Array.from(changedFiles), this.gitOpts, this.execOpts, this.options.dryRun));
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
    const tagVersionSeparator = this.options.tagVersionSeparator || '@';
    const tags = this.packagesToVersion.map((pkg) => `${pkg.name}${tagVersionSeparator}${this.updatesVersions?.get(pkg.name)}`);
    const subject = this.options.message || 'chore: Publish new release';
    const message = tags.reduce((msg, tag) => `${msg}${OS_EOL} - ${tag}`, `${subject}${OS_EOL}`);

    await gitCommit(message, this.gitOpts, this.execOpts, this.options.dryRun);
    for (const tag of tags) {
      await gitTag(tag, this.gitOpts, this.execOpts, this.options.gitTagCommand, this.options.dryRun);
    }

    return tags;
  }

  async gitCommitAndTagVersion() {
    const version = this.globalVersion;
    const tag = `${this.tagPrefix}${version}`;
    const message = this.options.message ? this.options.message.replace(/%s/g, tag).replace(/%v/g, version) : tag;

    await gitCommit(message, this.gitOpts, this.execOpts, this.options.dryRun);
    await gitTag(tag, this.gitOpts, this.execOpts, this.options.gitTagCommand, this.options.dryRun);

    return [tag];
  }

  gitPushToRemote() {
    // we could push tags one by one (to avoid GitHub limit)
    if (this.options.pushTagsOneByOne) {
      this.logger.info('git', 'Pushing tags one by one...');
      const promises: Promise<void>[] = [];
      const limit = pLimit(1);
      this.tags.forEach((tag) => {
        this.logger.verbose('git', `Pushing tag: ${tag}`);
        promises.push(limit(() => gitPushSingleTag(this.gitRemote, this.currentBranch, tag, this.execOpts, this.options.dryRun)));
      });
      return Promise.allSettled(promises);
    }

    // or push all tags by using followTags
    this.logger.info('git', 'Pushing tags...');
    return gitPush(this.gitRemote, this.currentBranch, this.execOpts, this.options.dryRun);
  }

  setGlobalVersionFloor() {
    const globalVersion = this.project.version;

    for (const node of this.updates) {
      if (semver.lt(node.version, globalVersion)) {
        this.logger.verbose('version', `Overriding version of ${node.name} from ${node.version} to ${globalVersion}`);

        node.pkg.version = globalVersion;
      }
    }
  }

  setGlobalVersionCeiling(versions: Map<string, string>) {
    let highestVersion = this.project.version;

    versions.forEach((bump: string) => {
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
