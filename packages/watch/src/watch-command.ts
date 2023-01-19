import {
  Command,
  Package,
  ProjectConfig,
  spawn,
  spawnStreaming,
  ValidationError,
  WatchCommandOption,
} from '@lerna-lite/core';
import { FilterOptions, getFilteredPackages } from '@lerna-lite/optional-cmd-common';
import chokidar from 'chokidar';
import path from 'path';

import { CHOKIDAR_AVAILABLE_OPTIONS, EMIT_CHANGES_DELAY, FILE_DELIMITER } from './constants';
import { ChangesStructure, ChokidarEventType } from './types';

export function factory(argv: WatchCommandOption) {
  return new WatchCommand(argv);
}
export class WatchCommand extends Command<WatchCommandOption & FilterOptions> {
  protected _args: string[] = [];
  protected _bail = false;
  protected _command = '';
  protected _count = 0;
  protected _changes: ChangesStructure = {};
  protected _env: { [key: string]: string | undefined } = {};
  protected _filteredPackages: Package[] = [];
  protected _packagePlural = '';
  protected _prefix = false;
  protected _watcher?: chokidar.FSWatcher;
  protected _timer?: NodeJS.Timeout;

  get requiresGit() {
    return false;
  }

  constructor(argv: WatchCommandOption | ProjectConfig) {
    super(argv);
  }

  async initialize() {
    if (!this.options.command) {
      throw new ValidationError('ENOCOMMAND', 'A command to execute is required');
    }

    const dashedArgs = this.options['--'] || [];
    this._command = this.options.cmd || dashedArgs.shift();
    this._args = (this.options.args || []).concat(dashedArgs);

    // inverted boolean options
    this._bail = this.options.bail !== false;
    this._prefix = this.options.prefix !== false;

    // accessing properties of process.env can be expensive,
    // so cache it here to reduce churn during tighter loops
    this._env = Object.assign({}, process.env);

    this._filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, this.options);

    this._count = this._filteredPackages.length;
    this._packagePlural = this._count === 1 ? 'package' : 'packages';

    if (
      (this.options.watchAllEvents && this.options.watchAddedFile) ||
      (this.options.watchAllEvents && this.options.watchAddedDir) ||
      (this.options.watchAllEvents && this.options.watchRemovedFile) ||
      (this.options.watchAllEvents && this.options.watchRemovedDir)
    ) {
      throw new ValidationError(
        'ENOTALLOWED',
        '--watch-all-events cannot be combined with other --watch-xyz option(s).'
      );
    }
  }

  async execute() {
    this.logger.info(
      'watch',
      'Executing command %j on changes in %d %s.',
      this.options.command,
      this._count,
      this._packagePlural
    );

    try {
      const packageLocations: string[] = [];
      const chokidarOptions: chokidar.WatchOptions = {
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
        ...this.options,
      };

      this._filteredPackages.forEach((pkg) => {
        // does user have a glob defined, if so append it to the pkg location. Glob example for TS files: /**/*.ts
        let watchingPath = pkg.location;
        if (this.options.glob) {
          watchingPath = path.join(pkg.location, '/', this.options.glob); // append glob to pkg location
        }
        packageLocations.push(watchingPath);
      });

      // the `awaitWriteFinish` option can be a complex object but in order to provide these options from the CLI, we'll prefix them with "awf"
      // when these prefix are found, we'll build the appropriate complex object, ie: awfPollInterval: 200 => { awaitWriteFinish: { pollInterval: 200 }}
      if (this.options.awfPollInterval !== undefined || this.options.awfStabilityThreshold !== undefined) {
        chokidarOptions.awaitWriteFinish = {};
        if (this.options.awfPollInterval !== undefined) {
          chokidarOptions.awaitWriteFinish.pollInterval = this.options.awfPollInterval;
        }
        if (this.options.awfStabilityThreshold !== undefined) {
          chokidarOptions.awaitWriteFinish.stabilityThreshold = this.options.awfStabilityThreshold;
        }
      }

      // remove any watch command options that don't belong to chokidar
      for (const key of Object.keys(chokidarOptions)) {
        if (!CHOKIDAR_AVAILABLE_OPTIONS.includes(key)) {
          delete chokidarOptions[key];
        }
      }

      // initialize chokidar watcher for each package found
      this._watcher = chokidar.watch(packageLocations, chokidarOptions);

      // add default event listeners
      this._watcher
        .on('change', (path) => this.changeEventListener('change', path))
        .on('error', (error) => this.onError(error));

      // add optional event listeners but only when enabled by the user for perf reasons
      if (this.options.watchAllEvents) {
        this._watcher.on('all', (event, path) => this.changeEventListener(event, path));
      }
      if (this.options.watchAddedFile) {
        this._watcher.on('add', (path) => this.changeEventListener('add', path));
      }
      if (this.options.watchRemovedFile) {
        this._watcher.on('unlink', (path) => this.changeEventListener('unlink', path));
      }
      if (this.options.watchAddedDir) {
        this._watcher.on('addDir', (path) => this.changeEventListener('addDir', path));
      }
      if (this.options.watchRemovedDir) {
        this._watcher.on('unlinkDir', (path) => this.changeEventListener('unlinkDir', path));
      }
    } catch (err) {
      this.onError(err);
    }
  }

  protected changeEventListener(eventType: ChokidarEventType, filepath: string) {
    return new Promise((resolve) => {
      const pkg = this._filteredPackages.find((p) => filepath.includes(p.location));
      if (pkg) {
        // changes structure sample: { '@lerna-lite/watch': { pkg: Package, events: { change: ['path1', 'path2'], unlink: ['path3'] } } }
        if (!this._changes[pkg.name]) {
          this._changes[pkg.name] = { pkg, events: {} as any };
        }
        if (!this._changes[pkg.name].events[eventType]) {
          this._changes[pkg.name].events[eventType] = new Set(); // use Set to avoid duplicate entires
        }
        this._changes[pkg.name].events[eventType].add(filepath);

        // once we reached emit change stability threshold, we'll fire events for each packages & events while the file paths array will be merged
        if (this._timer) clearTimeout(this._timer as NodeJS.Timeout);

        this._timer = setTimeout(() => {
          // since we waited a certain time, destructure the changes object
          // could include multiple packages to loop through and that will execute multiple events (1 for each package and 1 for each event)
          for (const changedPkgName of Object.keys(this._changes)) {
            const changedPkg = this._changes[changedPkgName].pkg;

            // loop through all possible events (add, addDir, unlink, unlinkDir)
            for (const changedType of Object.keys(this._changes[changedPkgName].events)) {
              const fileDelimiter = this.options?.fileDelimiter ?? FILE_DELIMITER;
              const changedFiles = Array.from<string>(this._changes[changedPkgName].events[changedType]);
              const mergedFiles = changedFiles.join(fileDelimiter);
              this.getRunner(changedPkg, mergedFiles, changedType);
              this.logger.verbose('watch', 'Handling %d files changed in %j.', changedFiles.length, changedPkg.name);
              resolve({ changedPkg, mergedFiles, changedType });
              delete this._changes[changedPkgName].events[changedType];
            }
            delete this._changes[changedPkgName];
          }
          this._changes = {};
        }, this.options.emitChangesDelay ?? EMIT_CHANGES_DELAY);
      }
    });
  }

  protected onError(error: any) {
    if (this._bail) {
      // stop watching.
      this._watcher?.close();

      // only the first error is caught
      process.exitCode = error?.exitCode ?? error?.code;

      // rethrow to halt chain and log properly
      throw error;
    } else {
      // propagate "highest" error code, it's probably the most useful
      const exitCode = error?.exitCode ?? error?.code;
      this.logger.error('', 'Received non-zero exit code %d during file watch', exitCode);
      process.exitCode = exitCode;
    }
  }

  protected getOpts(pkg: Package, changedFile: string, eventType: string) {
    return {
      cwd: pkg.location,
      shell: true,
      extendEnv: false,
      env: Object.assign({}, this._env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_FILE_CHANGE_TYPE: eventType,
        LERNA_FILE_CHANGES: changedFile,
      }),
      pkg,
      reject: this._bail,
    };
  }

  protected getRunner(pkg: Package, changedFile: string, eventType: string) {
    return this.options.stream
      ? this.runCommandInPackageStreaming(pkg, changedFile, eventType)
      : this.runCommandInPackageCapturing(pkg, changedFile, eventType);
  }

  protected runCommandInPackageStreaming(pkg: Package, changedFile: string, eventType: string) {
    return spawnStreaming(
      this._command,
      this._args,
      this.getOpts(pkg, changedFile, eventType),
      this._prefix && pkg.name
    );
  }

  protected runCommandInPackageCapturing(pkg: Package, changedFile: string, eventType: string) {
    return spawn(this._command, this._args, this.getOpts(pkg, changedFile, eventType));
  }
}
