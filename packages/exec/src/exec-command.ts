import 'dotenv/config';

import type { CommandType, ExecCommandOption, FilterOptions, Package, ProjectConfig } from '@lerna-lite/core';
import {
  Command,
  getFilteredPackages,
  logOutput,
  runTopologically,
  spawn,
  spawnStreaming,
  ValidationError,
} from '@lerna-lite/core';
import { Profiler } from '@lerna-lite/profiler';
import pMap from 'p-map';
import c from 'tinyrainbow';

import type { ExecStreamingOption } from './interfaces.js';

export function factory(argv: ExecCommandOption) {
  return new ExecCommand(argv);
}

export class ExecCommand extends Command<ExecCommandOption & FilterOptions> {
  /** command name */
  name = 'exec' as CommandType;

  args: string[] = [];
  bail = false;
  count?: number;
  env: { [key: string]: string | undefined } = {};
  filteredPackages: Package[] = [];
  packagePlural?: 'package' | 'packages';
  joinedCommand?: string;
  prefix = false;
  command = '';

  get requiresGit() {
    return false;
  }

  constructor(argv: ExecCommandOption | ProjectConfig) {
    super(argv);
  }

  initialize() {
    const dashedArgs = this.options['--'] || [];

    this.command = this.options.cmd || dashedArgs.shift();
    this.args = (this.options.args || []).concat(dashedArgs);

    if (!this.command) {
      throw new ValidationError('ENOCOMMAND', 'A command to execute is required');
    }

    // inverted boolean options
    this.bail = this.options.bail !== false;
    this.prefix = this.options.prefix !== false;

    // accessing properties of process.env can be expensive,
    // so cache it here to reduce churn during tighter loops
    this.env = Object.assign({}, process.env);

    let chain: Promise<any> = Promise.resolve();

    this.options.isIndependent = this.project.isIndependent();

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then((filteredPackages: Package[]) => {
      this.filteredPackages = filteredPackages;
    });

    return chain.then(() => {
      this.count = this.filteredPackages.length;
      this.packagePlural = this.count === 1 ? 'package' : 'packages';
      this.joinedCommand = [this.command].concat(this.args).join(' ');
    });
  }

  execute() {
    this.logger.info('', 'Executing command in %d %s: %j', this.count, this.packagePlural, this.joinedCommand);

    let chain: Promise<any> = Promise.resolve();

    if (this.options.parallel) {
      chain = chain.then(() => this.runCommandInPackagesParallel());
    } else if (this.toposort) {
      chain = chain.then(() => this.runCommandInPackagesTopological());
    } else {
      chain = chain.then(() => this.runCommandInPackagesLexical());
    }

    if (this.bail) {
      // only the first error is caught
      chain = chain.catch((err) => {
        process.exitCode = err.exitCode;

        // rethrow to halt chain and log properly
        throw err;
      });
    } else {
      // detect error (if any) from collected results
      chain = chain.then((results: Array<{ exitCode: number; failed?: boolean; pkg: Package; stderr: any }>) => {
        if (results.some((result) => result.failed)) {
          // propagate "highest" error code, it's probably the most useful
          const codes = results.filter((result) => result.failed).map((result) => result.exitCode);
          const exitCode = Math.max(...codes, 1);

          this.logger.error('', 'Received non-zero exit code %d during execution', exitCode);
          process.exitCode = exitCode;
        }
      });
    }

    return chain.then(() => {
      this.logger.success('exec', 'Executed command in %d %s: %j', this.count, this.packagePlural, this.joinedCommand);
    });
  }

  getOpts(pkg: Package): ExecStreamingOption {
    // these options are passed _directly_ to execa
    return {
      cwd: pkg.location,
      shell: true,
      extendEnv: false,
      env: Object.assign({}, this.env, {
        LERNA_PACKAGE_NAME: pkg.name,
        LERNA_ROOT_PATH: this.project.rootPath,
      }),
      reject: this.bail,
      pkg,
    };
  }

  getRunner() {
    return this.options.stream
      ? (pkg: Package) => this.runCommandInPackageStreaming(pkg)
      : (pkg: Package) => this.runCommandInPackageCapturing(pkg);
  }

  runCommandInPackagesTopological() {
    let profiler: Profiler;
    let runner: (pkg: Package) => Promise<any>;

    if (this.options.profile) {
      profiler = new Profiler({
        concurrency: this.concurrency,
        log: this.logger,
        outputDirectory: this.options.profileLocation || this.project.rootPath,
      });

      const callback = this.getRunner();
      runner = (pkg: Package) => profiler.run(() => callback(pkg), pkg.name);
    } else {
      runner = this.getRunner();
    }

    let chain: Promise<any> = runTopologically(this.filteredPackages, runner, {
      concurrency: this.concurrency,
      rejectCycles: this.options.rejectCycles,
    });

    if (profiler!) {
      chain = chain.then((results) => profiler.output().then(() => results));
    }

    return chain;
  }

  runCommandInPackagesParallel() {
    return pMap(this.filteredPackages, (pkg: Package) => this.runCommandInPackageStreaming(pkg));
  }

  runCommandInPackagesLexical() {
    return pMap(this.filteredPackages, this.getRunner(), { concurrency: this.concurrency });
  }

  runCommandInPackageStreaming(pkg: Package) {
    if (this.options.dryRun) {
      return this.dryRunExec(this.command, pkg.name);
    }
    return spawnStreaming(this.command, this.args, this.getOpts(pkg), this.prefix && pkg.name);
  }

  runCommandInPackageCapturing(pkg: Package) {
    if (this.options.dryRun) {
      return this.dryRunExec(this.command, pkg.name);
    }
    return spawn(this.command, this.args, this.getOpts(pkg));
  }

  dryRunExec(commandName: string, pkgName: string): Promise<any> {
    this.logger.info(c.bold(c.magenta('[dry-run] >')), `Exec command '%s' in '%s'`, commandName, pkgName);
    logOutput(`${c.bold(c.magenta('[dry-run] >'))} ${pkgName}`);
    return Promise.resolve();
  }
}
