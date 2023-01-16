import { Command, Package, spawn, toCamelCase, ValidationError, WatchCommandOption } from '@lerna-lite/core';
import { FilterOptions, getFilteredPackages } from '@lerna-lite/optional-cmd-common';
import chokidar from 'chokidar';
import path from 'path';

import { CHOKIDAR_AVAILABLE_OPTIONS, FILE_DELIMITER, MERGE_STABILITY_THRESHOLD } from './constants';
import { ChangesStructure, ChokidarEventType } from './types';

export function factory(argv: WatchCommandOption & FilterOptions) {
  return new WatchCommand(argv);
}
export class WatchCommand extends Command<WatchCommandOption & FilterOptions> {
  protected args: string[] = [];
  protected bail = false;
  protected command = '';
  protected count = 0;
  protected env: { [key: string]: string | undefined } = {};
  protected filteredPackages: Package[] = [];
  protected packagePlural = '';
  protected watcher?: chokidar.FSWatcher;
  protected _timer?: NodeJS.Timeout;
  protected _changes: ChangesStructure = {};

  get requiresGit() {
    return false;
  }

  constructor(argv: WatchCommandOption) {
    super(argv);
  }

  async initialize() {
    if (!this.options.command) {
      throw new ValidationError('ENOCOMMAND', 'A command to execute is required');
    }

    const dashedArgs = this.options['--'] || [];
    this.command = this.options.cmd || dashedArgs.shift();
    this.args = (this.options.args || []).concat(dashedArgs);

    // inverted boolean options
    this.bail = this.options.bail !== false;

    // accessing properties of process.env can be expensive,
    // so cache it here to reduce churn during tighter loops
    this.env = Object.assign({}, process.env);

    this.filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, this.options);

    this.count = this.filteredPackages.length;
    this.packagePlural = this.count === 1 ? 'package' : 'packages';
  }

  async execute() {
    this.logger.info(
      'watch',
      'Executing command %j on changes in %d %s.',
      this.options.command,
      this.count,
      this.packagePlural
    );

    try {
      const chokidarOptions: chokidar.WatchOptions = { ignoreInitial: true, persistent: true, ...this.options };

      const packageLocations: string[] = [];
      this.filteredPackages.forEach((pkg) => {
        // does user have a glob defined, if so append it to the pkg location. Glob example for TS files: /**/*.ts
        let watchingPath = pkg.location;
        if (this.options.glob) {
          watchingPath = path.join(pkg.location, this.options.glob); // append glob to pkg location
        }
        packageLocations.push(watchingPath);
      });

      // the `awaitWriteFinish` option can be a complex object but in order to provide these options from the CLI, we'll prefix them with "awf"
      // when these prefix are found, we'll build the appropriate complex object, ie: awfPollInterval: 200 => { awaitWriteFinish: { pollInterval: 200 }}
      if (this.options.awfPollInterval !== undefined || this.options.awfStabilityThreshold !== undefined) {
        chokidarOptions.awaitWriteFinish = {};
        ['awfPollInterval', 'awfStabilityThreshold'].forEach((awfKey) => {
          if (this.options[awfKey] !== undefined) {
            chokidarOptions.awaitWriteFinish![toCamelCase(awfKey.replace('awf', ''))] = this.options[awfKey];
          }
        });
      }

      // remove any watch command options that don't belong to chokidar
      for (const key of Object.keys(chokidarOptions)) {
        if (!CHOKIDAR_AVAILABLE_OPTIONS.includes(key)) {
          delete chokidarOptions[key];
        }
      }

      // initialize chokidar watcher for each package found
      // this.filteredPackages.forEach((pkg) => {
      this.watcher = chokidar.watch(packageLocations, chokidarOptions);

      // add default event listeners
      this.watcher
        .on('change', (path) => this.changeEventListener('change', path))
        .on('error', (error) => this.onError(error));

      // add optional event listeners but only when enabled by the user for perf reasons
      if (this.options.watchAddedFile) {
        this.watcher.on('add', (path) => this.changeEventListener('add', path));
      }
      if (this.options.watchRemovedFile) {
        this.watcher.on('unlink', (path) => this.changeEventListener('unlink', path));
      }
      if (this.options.watchAddedDir) {
        this.watcher.on('addDir', (path) => this.changeEventListener('addDir', path));
      }
      if (this.options.watchRemovedDir) {
        this.watcher.on('unlinkDir', (path) => this.changeEventListener('unlinkDir', path));
      }
    } catch (err) {
      this.onError(err);
    }
  }

  changeEventListener(eventType: ChokidarEventType, filepath: string) {
    const pkg = this.filteredPackages.find((p) => filepath.includes(p.location));
    if (pkg) {
      // changes structure sample: { '@lerna-lite/watch': { pkg: Package, events: { change: ['path1', 'path2'], unlink: ['path3'] } } }
      if (!this._changes[pkg.name]) {
        this._changes[pkg.name] = { pkg, events: {} as any };
      }
      if (!this._changes[pkg.name].events[eventType]) {
        this._changes[pkg.name].events[eventType] = [];
      }
      this._changes[pkg.name].events[eventType].push(filepath);

      // once we reached emit change stability threshold, we'll fire events for each packages & events while the file paths array will be merged
      clearTimeout(this._timer as NodeJS.Timeout);
      this._timer = setTimeout(() => {
        // since we waited a certain time, destructure the changes object
        // could include multiple packages to loop through and that will execute multiple events (1 for each package and 1 for each event)
        for (const changedPkgName of Object.keys(this._changes)) {
          const changedPkg = this._changes[changedPkgName].pkg;
          if (this._changes[changedPkgName].events) {
            for (const changedType of Object.keys(this._changes[changedPkgName].events)) {
              const fileDelimiter = this.options?.fileDelimiter ?? FILE_DELIMITER;
              const mergedFiles = this._changes[changedPkgName].events![changedType].join(fileDelimiter);
              this.runCommandInPackageCapturing(changedPkg, mergedFiles, changedType);
              delete this._changes[changedPkgName].events[changedType];
            }
            delete this._changes[changedPkgName];
          }
        }
        this._changes = {};
      }, this.options.emitChangesThreshold ?? MERGE_STABILITY_THRESHOLD);
    }
  }

  onError(error: any) {
    if (this.bail) {
      // stop watching.
      this.watcher?.close();

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

  getOpts(pkg: Package, changedFile: string, eventType: string) {
    return {
      cwd: pkg.location,
      shell: true,
      extendEnv: false,
      env: Object.assign({}, this.env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_FILE_CHANGE_TYPE: eventType,
        LERNA_FILE_CHANGES: changedFile,
      }),
      pkg,
      reject: this.bail,
    };
  }

  runCommandInPackageCapturing(pkg: Package, changedFile: string, eventType: string) {
    return spawn(this.command, this.args, this.getOpts(pkg, changedFile, eventType));
  }
}
