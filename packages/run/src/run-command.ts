import type { CommandType, FilterOptions, Package, ProjectConfig, RunCommandOption } from '@lerna-lite/core';
import { Command, getFilteredPackages, logOutput, runTopologically, ValidationError } from '@lerna-lite/core';
import { Profiler } from '@lerna-lite/profiler';
import pMap from 'p-map';
import c from 'tinyrainbow';

import type { ScriptStreamingOption } from './interfaces.js';
import { npmRunScript, npmRunScriptStreaming } from './lib/npm-run-script.js';
import { timer } from './lib/timer.js';

export function factory(argv: RunCommandOption) {
  return new RunCommand(argv);
}

export class RunCommand extends Command<RunCommandOption & FilterOptions> {
  /** command name */
  name = 'run' as CommandType;

  args: string[] = [];
  bail = false;
  count?: number;
  packagePlural?: 'package' | 'packages';
  joinedCommand?: string;
  prefix = false;
  npmClient = 'npm';
  packagesWithScript: Package[] = [];
  script = '';

  get requiresGit() {
    return false;
  }

  constructor(argv: RunCommandOption | ProjectConfig) {
    super(argv);
  }

  initialize() {
    const { script, npmClient = 'npm' } = this.options;

    this.script = script;
    this.args = this.options['--'] || [];
    this.npmClient = npmClient;

    if (!script) {
      throw new ValidationError('ENOSCRIPT', 'You must specify a lifecycle script to run');
    }

    // inverted boolean options
    this.bail = this.options.bail !== false;
    this.prefix = this.options.prefix !== false;

    let chain: Promise<any> = Promise.resolve();
    if (!this.options.log) {
      this.options.log = this.logger;
    }

    this.options.isIndependent = this.project.isIndependent();

    chain = chain.then(() => getFilteredPackages(this.packageGraph!, this.execOpts, this.options));
    chain = chain.then((filteredPackages: Package[]) => {
      this.packagesWithScript =
        script === 'env' ? filteredPackages : filteredPackages.filter((pkg) => pkg.scripts && pkg.scripts[script]);
    });

    return chain.then(() => {
      this.count = this.packagesWithScript.length;
      this.packagePlural = this.count === 1 ? 'package' : 'packages';
      this.joinedCommand = [this.npmClient, 'run', this.script].concat(this.args).join(' ');

      if (!this.count) {
        this.logger.info('run', `No packages found with the lifecycle script "${script}"`);

        // still exits zero, aka 'ok'
        return false;
      }
    });
  }

  execute() {
    let chain: Promise<any> = Promise.resolve();
    const getElapsed = timer();

    if (this.options.parallel) {
      this.logger.verbose('Parallel', this.joinedCommand!);
      chain = chain.then(() => this.runScriptInPackagesParallel());
    } else if (this.toposort) {
      this.logger.verbose('Topological', this.joinedCommand!);
      chain = chain.then(() => this.runScriptInPackagesTopological());
    } else {
      this.logger.verbose('Lexical', this.joinedCommand!);
      chain = chain.then(() => this.runScriptInPackagesLexical());
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
      chain = chain.then((results: Array<{ exitCode: number; failed?: boolean; pkg?: Package; stderr: any }>) => {
        if (results?.some((result?: { failed?: boolean }) => result?.failed)) {
          // propagate 'highest' error code, it's probably the most useful
          const codes = results.filter((result) => result?.failed).map((result) => result.exitCode);
          const exitCode = Math.max(...codes, 1);

          this.logger.error('', 'Received non-zero exit code %d during execution', exitCode);
          if (!this.options.stream) {
            results
              .filter((result) => result?.failed)
              .forEach((result) => {
                this.logger.error('', result.pkg?.name ?? '', result.stderr);
              });
          }
          process.exitCode = exitCode;
        }
        return results;
      });
    }

    return chain.then((results: Array<{ exitCode: number; failed?: boolean; pkg?: Package; stderr: any }>) => {
      const someFailed = results?.some((result) => result?.failed);
      const logType = someFailed ? 'error' : 'success';

      this.logger[logType](
        'run',
        `Ran npm script '%s' in %d %s in %ss:`,
        this.script,
        this.count,
        this.packagePlural,
        (getElapsed() / 1000).toFixed(1)
      );

      if (!this.bail && !this.options.stream) {
        results.forEach((result) => {
          if (result?.failed) {
            this.logger.error('', ` - ${result.pkg?.name ?? ''}`);
          } else {
            this.logger.success('', ` - ${result.pkg?.name ?? ''}`);
          }
        });
      } else {
        this.logger.success('', this.packagesWithScript.map((pkg) => `- ${pkg.name}`).join('\n'));
      }
    });
  }

  getOpts(pkg: Package): ScriptStreamingOption {
    // these options are NOT passed directly to execa, they are composed in npm-run-script
    return {
      args: this.args,
      npmClient: this.npmClient,
      prefix: this.prefix,
      reject: this.bail,
      pkg,
    };
  }

  getRunner() {
    return this.options.stream
      ? (pkg: Package) => this.runScriptInPackageStreaming(pkg)
      : (pkg: Package) => this.runScriptInPackageCapturing(pkg);
  }

  runScriptInPackagesTopological() {
    let profiler: Profiler;
    let runner: (pkg: Package) => Promise<any>;

    if (this.options.profile) {
      profiler = new Profiler({
        concurrency: this.concurrency,
        log: this.logger,
        outputDirectory: this.options.profileLocation,
      });

      const callback = this.getRunner();
      runner = (pkg: Package) => profiler.run(() => callback(pkg), pkg.name);
    } else {
      runner = this.getRunner();
    }

    let chain: Promise<any> = runTopologically(this.packagesWithScript, runner, {
      concurrency: this.concurrency,
      rejectCycles: this.options.rejectCycles,
      npmClient: this.options.npmClient,
    });

    if (profiler!) {
      chain = chain.then((results) => profiler.output().then(() => results));
    }

    return chain;
  }

  runScriptInPackagesParallel() {
    return pMap(this.packagesWithScript, (pkg: Package) => this.runScriptInPackageStreaming(pkg));
  }

  runScriptInPackagesLexical() {
    return pMap(this.packagesWithScript, this.getRunner(), { concurrency: this.concurrency });
  }

  runScriptInPackageStreaming(pkg: Package) {
    if (this.options.dryRun) {
      return this.dryRunScript(this.script, pkg.name);
    }

    const chain: Promise<any> = npmRunScriptStreaming(this.script, this.getOpts(pkg));
    if (!this.bail) {
      chain.then((result: { exitCode: number; failed?: boolean; pkg: Package; stderr: any }) => ({ ...result, pkg }));
    }
    return chain;
  }

  runScriptInPackageCapturing(pkg: Package) {
    const getElapsed = timer();

    if (this.options.dryRun) {
      return this.dryRunScript(this.script, pkg.name);
    }

    return npmRunScript(this.script, this.getOpts(pkg)).then(
      (result: { exitCode: number; failed?: boolean; pkg: Package; stderr: any; stdout: any }) => {
        this.logger.info('run', `Ran npm script '%s' in '%s' in %ss:`, this.script, pkg.name, (getElapsed() / 1000).toFixed(1));
        logOutput(result.stdout);
        if (!this.bail) {
          return { ...result, pkg };
        }
        return result;
      }
    );
  }

  dryRunScript(scriptName: string, pkgName: string): Promise<any> {
    this.logger.info(c.bold(c.magenta('[dry-run] >')), `Run npm script '%s' in '%s'`, scriptName, pkgName);
    logOutput(`${c.bold(c.magenta('[dry-run] >'))} ${pkgName}`);
    return Promise.resolve();
  }
}
