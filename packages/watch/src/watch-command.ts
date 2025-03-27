import {
  Command,
  type FilterOptions,
  type Package,
  type ProjectConfig,
  getFilteredPackages,
  pluralize,
  spawn,
  spawnStreaming,
  ValidationError,
  type WatchCommandOption,
} from '@lerna-lite/core';
import { type ChokidarOptions, type FSWatcher, watch } from 'chokidar';
import { join, relative } from 'node:path';
import picomatch from 'picomatch';
import { globSync } from 'tinyglobby';

import { CHOKIDAR_AVAILABLE_OPTIONS, DEBOUNCE_DELAY, FILE_DELIMITER } from './constants.js';
import type { ChangesStructure } from './models.js';

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
  protected _fileDelimiter = '';
  protected _packagePlural = '';
  protected _prefix = false;
  protected _processing = false;
  protected _ignoredGlobs: string[] = [];
  protected _timerChange?: NodeJS.Timeout;
  protected _watcher?: FSWatcher;
  protected _watchedFiles: Set<string> = new Set();

  get requiresGit() {
    return false;
  }

  get watchedFiles() {
    return this._watchedFiles;
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
    this._fileDelimiter = this.options?.fileDelimiter ?? FILE_DELIMITER;

    // inverted boolean options
    this._bail = this.options.bail !== false;
    this._prefix = this.options.prefix !== false;

    // accessing properties of process.env can be expensive,
    // so cache it here to reduce churn during tighter loops
    this._env = Object.assign({}, process.env);

    this._filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, this.options);

    this._count = this._filteredPackages.length;
    this._packagePlural = this._count === 1 ? 'package' : 'packages';
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
      const { ignored = [], ...otherOptions } = this.options ?? {};
      this._ignoredGlobs = ['**/.git/**', '**/dist/**', '**/node_modules/**', ...(Array.isArray(ignored) ? ignored : [ignored])];

      const chokidarOptions: ChokidarOptions = {
        // we should ignore certain folders by default, we could use nearly the same implementation as ViteJS
        // https://github.com/vitejs/vite/blob/c747a3f289183b3640a6d4a1410acb5eafd11129/packages/vite/src/node/watch.ts
        ignoreInitial: true,
        ignorePermissionErrors: true,
        persistent: true,
        ...otherOptions,
      };

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

      // convert strings to picomatch pattern functions for chokidar compat
      const ignoredMatchers = this._ignoredGlobs.map((pattern) => {
        if (typeof pattern === 'string') {
          const matcher = picomatch(pattern, { dot: true });
          return (path: string) => matcher(path);
        }
        /* v8 ignore next */
        return pattern;
      });

      // initialize chokidar watcher by adding all package folders to the watcher,
      // we'll use all directories so that when new files are being added, they will also be inspected
      const pkgFolders = this._filteredPackages.map((pkg) => this.posixifyPath(pkg.location));
      const foldersToWatch = globSync(pkgFolders, { onlyDirectories: true, ignore: this._ignoredGlobs });
      this._watcher = watch(foldersToWatch, {
        ...chokidarOptions,
        cwd: process.cwd(),
        ignored: ignoredMatchers,
      });

      // also generate the full list of files to watch so that we can inspect it before calling the handler
      this.regenerateWatchGlobPaths();

      // add Chokidar watcher and watch for all events (add, addDir, unlink, unlinkDir)
      this._watcher
        .on('all', (event, filePath) => {
          const rootPath = process.cwd();
          const relativeFilePath = relative(rootPath, filePath);

          // when a file(s) are being added, we'll regenerate the list of paths that are watched
          if (event === 'add') {
            this.regenerateWatchGlobPaths();
          }

          // make sure that the file is in the watch before calling the callback
          if (this._watchedFiles.has(this.posixifyPath(relativeFilePath))) {
            return this.changeEventListener(relativeFilePath);
          }
        })
        .on('error', (error) => this.onError(error));

      // also watch for any Signal termination to cleanly exit the watch command
      process.once('SIGINT', () => this.handleTermination(128 + 2));
      process.once('SIGTERM', () => this.handleTermination(128 + 15));
      process.stdin.on('end', () => this.handleTermination());
      /* v8 ignore next 3 */
    } catch (err) {
      this.onError(err);
    }
  }

  protected changeEventListener(relativeFilePath: string) {
    // find the package that the filepath is associated to
    const rootPath = process.cwd();
    const pkg = this._filteredPackages.find((p) => relativeFilePath.includes(relative(rootPath, p.location)));

    if (pkg) {
      // changes structure sample: { '@lerna-lite/watch': { pkg: Package, changeFiles: ['path1', 'path2'] }
      if (!this._changes[pkg.name] || !this._changes[pkg.name].changeFiles) {
        this._changes[pkg.name] = { pkg, changeFiles: new Set<string>(), timestamp: Date.now() }; // use Set to avoid duplicate entries
      }
      this._changes[pkg.name].changeFiles.add(relativeFilePath);

      return this.executeCommandCallback();
    }
  }

  protected executeCommandCallback() {
    const debounceDelay = this.options.debounce ?? DEBOUNCE_DELAY;

    return new Promise((resolve) => {
      // once we reached emit change stability threshold, we'll fire events for each packages & events while the file paths array will be merged
      if (this._timerChange) {
        clearTimeout(this._timerChange as NodeJS.Timeout);
      }

      // chokidar triggers events for every single file change (add, unlink, ...),
      // so in order for us to merge all changes and return them under a single lerna watch event we need to wait a certain delay
      this._timerChange = setTimeout(async () => {
        // sort the changes by their timestamp to make sure that we execute them by queued time of entry
        const sortedChanges = Object.values(this._changes).sort((a, b) => a.timestamp - b.timestamp);

        // destructuring the changes object, it could include multiple packages and files to loop through (1 change for each package)
        for (const change of sortedChanges) {
          const changedPkg = change.pkg;

          // execute command callback when file changes are found
          if (change.changeFiles?.size > 0) {
            const changedFiles = Array.from<string>(change.changeFiles).map((f) => join(process.cwd(), f));
            const changedFilesCsv = changedFiles.join(this._fileDelimiter);

            // make sure there's nothing in progress before executing the next callback
            if (!this._processing) {
              this._processing = true;
              // prettier-ignore
              this.logger.info('watch', 'Detected %d %s changed in %j.', changedFiles.length, pluralize('file', changedFiles.length), changedPkg.name );
              change.changeFiles.clear();
              delete this._changes[changedPkg.name];
              await this.getRunner(changedPkg, changedFilesCsv);
              this._processing = false;

              // we might still have other packages that have changes though, so re-execute command callback process if any were found
              if (this.hasQueuedChanges()) {
                this.executeCommandCallback();
              }

              const pkgLn = Object.keys(this._changes || {}).length;
              this.logger.verbose('watch', `Found %d ${pluralize('package', pkgLn)} left in the queue.`, pkgLn);
              if (pkgLn === 0) {
                this.logger.info('watch', 'All commands completed, waiting for next change...');
              }
            }
            // resolving the promise is only useful for unit tests
            resolve({ changedPkg, mergedFiles: changedFilesCsv });
          }
        }
      }, debounceDelay);
    });
  }

  protected async handleTermination(exitCode?: number) {
    try {
      this.logger.info('watch', 'Termination call detected, exiting the Watch');
      this.logger.silly('watch', `Watch process terminated with exit code: ${exitCode}`);
      process.off('SIGINT', () => this.handleTermination(128 + 2));
      process.off('SIGTERM', () => this.handleTermination(128 + 15));
      process.stdin.off('end', this.handleTermination);

      await this._watcher?.close();
    } finally {
      process.exit(exitCode);
    }
  }

  protected hasQueuedChanges() {
    for (const pkgName of Object.keys(this._changes)) {
      if (this._changes[pkgName].changeFiles.size > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * take any path (windows/posix) and normalize it as a posix path,
   * note that we have this in place because tinyglobby returns posix paths even on windows,
   * see: https://github.com/SuperchupuDev/tinyglobby/issues/102
   */
  protected posixifyPath(filePath: string) {
    return filePath.replace(/\\/g, '/');
  }

  protected onError(error: any) {
    const exitCode = error?.exitCode ?? error?.code;

    if (this._bail) {
      // only the first error is caught
      process.exitCode = exitCode as number;
      this.handleTermination(process.exitCode);

      // rethrow to halt chain and log properly
      throw error;
    } else {
      // propagate "highest" error code, it's probably the most useful, but keep watch process alive
      this.logger.error('', 'Received non-zero exit code %d during file watch', exitCode);
      process.exitCode = exitCode as number;
    }
  }

  protected getOpts(pkg: Package, changedFile: string) {
    return {
      cwd: pkg.location,
      shell: true,
      extendEnv: false,
      env: Object.assign({}, this._env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_FILE_CHANGES: changedFile,
      }),
      pkg,
      reject: this._bail,
    };
  }

  protected getRunner(pkg: Package, changedFile: string) {
    return this.options.stream
      ? this.runCommandInPackageStreaming(pkg, changedFile)
      : this.runCommandInPackageCapturing(pkg, changedFile);
  }

  protected regenerateWatchGlobPaths() {
    const patterns: string[] = [];

    this._filteredPackages.forEach((pkg) => {
      // does user have a glob defined, if so append it to the pkg location. Glob example for TS files: /**/*.ts
      let watchingPath = pkg.location;
      if (this.options.glob) {
        watchingPath = join(pkg.location, '/', this.options.glob); // append glob to pkg location
      }
      const unixPath = this.posixifyPath(watchingPath);
      patterns.push(unixPath);
    });

    this._watchedFiles = new Set(globSync(patterns, { ignore: this._ignoredGlobs }));
  }

  protected runCommandInPackageStreaming(pkg: Package, changedFile: string) {
    return spawnStreaming(this._command, this._args, this.getOpts(pkg, changedFile), this._prefix && pkg.name);
  }

  protected runCommandInPackageCapturing(pkg: Package, changedFile: string) {
    return spawn(this._command, this._args, this.getOpts(pkg, changedFile));
  }
}
