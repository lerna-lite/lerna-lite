import { isAbsolute, join, relative } from 'node:path';

import {
  Command,
  getFilteredPackages,
  pluralize,
  spawn,
  spawnStreaming,
  ValidationError,
  type ChildProcessPromise,
  type FilterOptions,
  type Package,
  type ProjectConfig,
  type WatchCommandOption,
} from '@lerna-lite/core';
import { watch, type ChokidarOptions, type FSWatcher } from 'chokidar';
import zeptomatch from 'zeptomatch';

import { CHOKIDAR_AVAILABLE_OPTIONS, DEBOUNCE_DELAY, FILE_DELIMITER } from './constants.js';
import type { ChangesStructure } from './models.js';
import { terminateChildProcess } from './terminate-child-process.js';

export function factory(argv: WatchCommandOption) {
  return new WatchCommand(argv);
}

export class WatchCommand extends Command<WatchCommandOption & FilterOptions> {
  protected _args: string[] = [];
  protected _bail = false;
  protected _command = '';
  protected _count = 0;
  protected _changes: ChangesStructure = Object.create(null);
  protected _env: { [key: string]: string | undefined } = {};
  protected _filteredPackages: Package[] = [];
  protected _fileDelimiter = '';
  protected _packagePlural = '';
  protected _prefix = false;
  protected _processing = false;
  protected _ignoredGlobs: string[] = [];
  protected _timerChange?: NodeJS.Timeout;
  protected _watcher?: FSWatcher;
  protected _watchedFiles = new Set<string>();
  protected _ready = false;
  protected _stopping = false;
  protected _termination?: Promise<void>;
  protected _runningCommand?: ChildProcessPromise;
  protected _pendingChanges?: Promise<void>;
  protected _resolveChanges?: () => void;
  protected _resolveReady?: () => void;
  protected _onSigint = () => {
    void this.handleTermination(130, 'SIGINT');
  };
  protected _onSigterm = () => {
    void this.handleTermination(143);
  };
  protected _onStdinEnd = () => {
    void this.handleTermination();
  };

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

    const dashedArgs = [...(this.options['--'] || [])];
    this._command = this.options.cmd || dashedArgs.shift();
    this._args = (this.options.args || []).concat(dashedArgs);
    this._fileDelimiter = this.options.fileDelimiter ?? FILE_DELIMITER;
    this._bail = this.options.bail !== false;
    this._prefix = this.options.prefix !== false;
    this._env = Object.assign({}, process.env);
    this._filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, this.options);
    // A nested workspace owns its files ahead of any enclosing workspace.
    this._filteredPackages.sort((a, b) => b.location.length - a.location.length);
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

    if (!this._count) {
      return;
    }

    try {
      const { ignored = [], ...otherOptions } = this.options;
      this._ignoredGlobs = ['**/.git/**', '**/dist/**', '**/node_modules/**', ...(Array.isArray(ignored) ? ignored : [ignored])];
      const chokidarOptions: ChokidarOptions = {
        ignorePermissionErrors: true,
        persistent: true,
        ...otherOptions,
      };

      if (this.options.awfPollInterval !== undefined || this.options.awfStabilityThreshold !== undefined) {
        chokidarOptions.awaitWriteFinish = {};
        if (this.options.awfPollInterval !== undefined) {
          chokidarOptions.awaitWriteFinish.pollInterval = this.options.awfPollInterval;
        }
        if (this.options.awfStabilityThreshold !== undefined) {
          chokidarOptions.awaitWriteFinish.stabilityThreshold = this.options.awfStabilityThreshold;
        }
      }

      for (const key of Object.keys(chokidarOptions)) {
        if (!CHOKIDAR_AVAILABLE_OPTIONS.includes(key)) {
          delete chokidarOptions[key];
        }
      }

      // Chokidar performs the initial inventory, including dotfiles, and prunes
      // ignored directories. Later events update this inventory without rescanning.
      this._watcher = watch(
        this._filteredPackages.map((pkg) => pkg.location),
        {
          ...chokidarOptions,
          cwd: this.project.rootPath,
          ignoreInitial: false,
          ignored: [(path) => this.isIgnored(this.relativePath(path))],
        }
      );

      process.once('SIGINT', this._onSigint);
      process.once('SIGTERM', this._onSigterm);
      process.stdin.on('end', this._onStdinEnd);
      if (!process.stdin.isTTY) {
        process.stdin.resume();
      }

      await new Promise<void>((resolve) => {
        this._resolveReady = resolve;
        this._watcher!.on('all', (event, filePath) => this.handleFileEvent(event, filePath))
          .on('error', (error) => {
            void this.onError(error, true);
          })
          .once('ready', () => {
            this._ready = true;
            if (!this._stopping) {
              this.logger.info('watch', 'Watching for changes...');
            }
            this._resolveReady?.();
            this._resolveReady = undefined;
          });
      });
    } catch (error) {
      await this.onError(error, true);
    }
  }

  protected handleFileEvent(event: string, filePath: string) {
    if (this._stopping) {
      return;
    }
    const path = this.relativePath(filePath);
    if (event === 'unlinkDir') {
      for (const file of this._watchedFiles) {
        if (file.startsWith(`${path}/`)) {
          this._watchedFiles.delete(file);
        }
      }
      return;
    }
    if (event !== 'add' && event !== 'change' && event !== 'unlink') {
      return;
    }
    const pkg = this.findPackage(path);
    if (!pkg || this.isIgnored(path)) {
      return;
    }
    const packagePath = this.posixifyPath(relative(pkg.location, join(this.project.rootPath, path)));
    const pattern = this.posixifyPath(this.options.glob || '**/*').replace(/^\/+/, '');
    if (!zeptomatch(pattern, packagePath)) {
      return;
    }

    if (event === 'unlink') {
      this._watchedFiles.delete(path);
    } else {
      this._watchedFiles.add(path);
    }
    if (this._ready || this.options.ignoreInitial === false) {
      return this.changeEventListener(path);
    }
  }

  protected findPackage(path: string) {
    return this._filteredPackages.find((pkg) => {
      const packagePath = this.posixifyPath(relative(this.project.rootPath, pkg.location));
      return packagePath === '' || path.startsWith(`${packagePath}/`);
    });
  }

  protected isIgnored(path: string) {
    let ignored = false;
    for (const pattern of this._ignoredGlobs) {
      const negated = pattern.startsWith('!');
      const glob = this.posixifyPath(negated ? pattern.slice(1) : pattern);
      if (zeptomatch(glob, path) || zeptomatch(glob, `${path}/`)) {
        ignored = !negated;
      }
    }
    return ignored;
  }

  protected relativePath(path: string) {
    return this.posixifyPath(isAbsolute(path) ? relative(this.project.rootPath, path) : path);
  }

  protected changeEventListener(path: string) {
    if (this._stopping) {
      return Promise.resolve();
    }
    const pkg = this.findPackage(path);
    if (!pkg) {
      return Promise.resolve();
    }
    this._changes[pkg.name] ??= { pkg, changeFiles: new Set<string>(), timestamp: Date.now() };
    this._changes[pkg.name].changeFiles.add(path);
    return this.executeCommandCallback();
  }

  protected executeCommandCallback() {
    // Share one completion promise across the batch, including events received
    // while a command is running. Resetting debounce never abandons a promise.
    this._pendingChanges ??= new Promise<void>((resolve) => {
      this._resolveChanges = resolve;
    });
    clearTimeout(this._timerChange);
    this._timerChange = setTimeout(() => {
      this._timerChange = undefined;
      if (!this._processing) {
        void this.processChanges().catch((error) => this.onError(error, true));
      }
    }, this.options.debounce ?? DEBOUNCE_DELAY);
    return this._pendingChanges;
  }

  protected async processChanges() {
    this._processing = true;
    try {
      while (!this._stopping && !this._timerChange) {
        const change = Object.values(this._changes).sort((a, b) => a.timestamp - b.timestamp)[0];
        if (!change) {
          break;
        }
        delete this._changes[change.pkg.name];
        const files = Array.from(change.changeFiles, (file) => join(this.project.rootPath, file));
        this.logger.info(
          'watch',
          'Detected %d %s changed in %j.',
          files.length,
          pluralize('file', files.length),
          change.pkg.name
        );
        try {
          this._runningCommand = this.getRunner(change.pkg, files.join(this._fileDelimiter));
          const result = await this._runningCommand;
          if (result?.failed || (typeof result?.exitCode === 'number' && result.exitCode !== 0)) {
            await this.onError(result);
          }
        } catch (error) {
          await this.onError(error);
        } finally {
          this._runningCommand = undefined;
        }
      }
    } finally {
      this._processing = false;
      if (!this._timerChange && !Object.keys(this._changes).length) {
        this.resolveChanges();
        if (!this._stopping) {
          this.logger.info('watch', 'All commands completed, waiting for next change...');
        }
      }
    }
  }

  protected resolveChanges() {
    this._resolveChanges?.();
    this._resolveChanges = undefined;
    this._pendingChanges = undefined;
  }

  protected handleTermination(exitCode?: number, signal: NodeJS.Signals = 'SIGTERM') {
    if (!this._termination) {
      this._stopping = true;
      clearTimeout(this._timerChange);
      this._timerChange = undefined;
      this._changes = Object.create(null);
      process.off('SIGINT', this._onSigint);
      process.off('SIGTERM', this._onSigterm);
      process.stdin.off('end', this._onStdinEnd);
      if (!process.stdin.isTTY) {
        process.stdin.pause();
      }
      if (exitCode !== undefined) {
        process.exitCode = exitCode;
      }
      this._termination = this.terminate(signal);
    }
    return this._termination;
  }

  protected async terminate(signal: NodeJS.Signals) {
    this.logger.info('watch', 'Termination call detected, exiting the Watch');
    const results = await Promise.allSettled([
      terminateChildProcess(this._runningCommand?.process, signal),
      Promise.resolve().then(() => this._watcher?.close()),
    ]);
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error('watch', 'Failed to clean up: %s', result.reason?.message ?? result.reason);
        process.exitCode ||= 1;
      }
    }
    this._watchedFiles.clear();
    this._resolveReady?.();
    this._resolveReady = undefined;
    this.resolveChanges();
    // Let Node flush output and leave once the watcher and children have closed.
  }

  protected posixifyPath(filePath: string) {
    return filePath.replace(/\\/g, '/');
  }

  protected async onError(error: any, fatal = false) {
    if (this._stopping) {
      return;
    }
    const code = error?.exitCode ?? error?.code;
    const exitCode = typeof code === 'number' && Number.isInteger(code) && code > 0 && code <= 255 ? code : 1;
    process.exitCode = Math.max(Number(process.exitCode) || 0, exitCode);
    this.logger.error(
      'watch',
      'Command or watcher failed (exit %d): %s',
      exitCode,
      error?.message ?? error?.code ?? this._command
    );
    if (fatal || this._bail) {
      await this.handleTermination(Number(process.exitCode));
    }
  }

  protected getOpts(pkg: Package, changedFile: string) {
    return {
      cwd: pkg.location,
      shell: this.options.shell !== false,
      extendEnv: false,
      env: Object.assign({}, this._env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_FILE_CHANGES: changedFile,
      }),
      pkg,
      reject: this._bail,
      // A separate POSIX process group lets shutdown reach shell grandchildren.
      nodeOptions: { detached: process.platform !== 'win32', windowsHide: true },
    };
  }

  protected getRunner(pkg: Package, changedFile: string): ChildProcessPromise {
    return this.options.stream
      ? this.runCommandInPackageStreaming(pkg, changedFile)
      : this.runCommandInPackageCapturing(pkg, changedFile);
  }

  protected runCommandInPackageStreaming(pkg: Package, changedFile: string): ChildProcessPromise {
    return spawnStreaming(
      this._command,
      this._args,
      { ...this.getOpts(pkg, changedFile), buffer: false },
      this._prefix && pkg.name
    );
  }

  protected runCommandInPackageCapturing(pkg: Package, changedFile: string): ChildProcessPromise {
    return spawn(this._command, this._args, this.getOpts(pkg, changedFile));
  }
}
