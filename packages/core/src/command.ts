import { cpus } from 'node:os';

import type { Logger } from '@lerna-lite/npmlog';
import { log } from '@lerna-lite/npmlog';
import { isCI } from 'ci-info';
import dedent from 'dedent';
import type { SyncOptions } from 'execa';
import { execaSync } from 'execa';

import { logExecCommand } from './child-process.js';
import type { FilterOptions } from './filter-packages/index.js';
import { getFilteredPackages } from './filter-packages/index.js';
import type {
  ChangedCommandOption,
  DiffCommandOption,
  ExecCommandOption,
  InitCommandOption,
  ListCommandOption,
  PublishCommandOption,
  VersionCommandOption,
  WatchCommandOption,
} from './models/command-options.js';
import type { CommandType, ExecOpts, ProjectConfig } from './models/interfaces.js';
import { PackageGraph } from './package-graph/package-graph.js';
import type { Package } from './package.js';
import { Project } from './project/project.js';
import { cleanStack } from './utils/clean-stack.js';
import { logPackageError } from './utils/log-package-error.js';
import { warnIfHanging } from './utils/warn-if-hanging.js';
import { writeLogFile } from './utils/write-log-file.js';
import { ValidationError } from './validation-error.js';

// maxBuffer value for running exec
const DEFAULT_CONCURRENCY = cpus().length;

type AvailableCommandOption =
  | ChangedCommandOption
  | DiffCommandOption
  | ExecCommandOption
  | InitCommandOption
  | ListCommandOption
  | PublishCommandOption
  | VersionCommandOption
  | WatchCommandOption
  | ProjectConfig;

export class Command<T extends AvailableCommandOption> {
  argv: any;
  concurrency!: number;
  envDefaults: any;
  sort: any;
  toposort?: boolean;

  execOpts!: ExecOpts;
  commandName: CommandType = '';
  composed;
  logger!: Logger;
  options!: T & ExecOpts & ProjectConfig & FilterOptions;
  project!: Project;
  packageGraph!: PackageGraph;
  runner?: Promise<any>;

  constructor(readonly _argv: AvailableCommandOption) {
    log.pause();
    log.heading = 'lerna-lite';

    const argv = { ..._argv } as ProjectConfig;
    log.silly('argv', JSON.stringify(argv));

    // 'FooCommand' => 'foo'
    this.commandName = this.constructor.name.replace(/Command$/, '').toLowerCase() as CommandType;

    // composed commands are called from other commands, like publish -> version
    this.composed = typeof argv.composed === 'string' && argv.composed !== this.commandName;

    if (!this.composed) {
      // composed commands have already logged the lerna version
      log.notice('cli', `v${argv.lernaVersion}`);
    }

    // launch the command
    let runner = new Promise((resolve, reject) => {
      // run everything inside a Promise chain
      let chain: Promise<any> = Promise.resolve();

      chain = chain.then(() => (this.project = new Project(argv.cwd)));
      chain = chain.then(() => this.configureEnvironment());
      chain = chain.then(() => this.configureOptions());
      chain = chain.then(() => this.configureProperties());
      chain = chain.then(() => this.configureLogging());
      chain = chain.then(() => this.runValidations());
      chain = chain.then(() => this.runPreparations());
      chain = chain.then(() => this.runCommand());

      chain.then(
        (result) => {
          warnIfHanging();

          resolve(result);
        },
        (err) => {
          if (err.pkg) {
            // Cleanly log specific package error details
            logPackageError(err, this.options.stream);
          } else if (err.name !== 'ValidationError') {
            // npmlog does some funny stuff to the stack by default,
            // so pass it directly to avoid duplication.
            log.error('', cleanStack(err, this.constructor.name));
          }

          // ValidationError does not trigger a log dump, nor do external package errors
          if (err.name !== 'ValidationError' && !err.pkg) {
            // Suppress ExitPromptError when terminating the prompt (sending SIGINT)
            if (err.name === 'ExitPromptError') {
              console.error('Termination call detected, exiting command');
              resolve(null);
              return;
            }
            writeLogFile(this.project.rootPath);
          }

          warnIfHanging();

          // error code is handled by cli.fail()
          reject(err);

          if (err.name === 'ValidationError') {
            log.error(err.code, (err.body && err.body.error) || err.message);
          }
        }
      );
    });

    // passed via yargs context in tests, never actual CLI
    if (argv.onResolved || argv.onRejected) {
      runner = runner.then(argv.onResolved, argv.onRejected);

      // when nested, never resolve inner with outer callbacks
      delete argv.onResolved;
      delete argv.onRejected;
    }

    // 'hide' irrelevant argv keys from options
    for (const key of ['cwd', '$0']) {
      Object.defineProperty(argv, key, { enumerable: false });
    }

    Object.defineProperty(this, 'argv', {
      value: Object.freeze(argv),
    });

    Object.defineProperty(this, 'runner', {
      value: runner,
    });
  }

  // proxy 'Promise' methods to 'private' instance
  then(onResolved: typeof Promise.resolve, onRejected: typeof Promise.reject) {
    return this.runner?.then(onResolved, onRejected);
  }

  /* v8 ignore next */
  catch(onRejected: typeof Promise.reject) {
    return this.runner?.catch(onRejected);
  }

  get requiresGit() {
    return true;
  }

  // Override this to inherit config from another command.
  // For example `changed` inherits config from `publish`.
  get otherCommandConfigs(): string[] {
    return [];
  }

  configureEnvironment() {
    let loglevel;
    let progress;

    /* v8 ignore next if */
    if (isCI || !process.stderr.isTTY || process.env.TERM === 'dumb') {
      log.disableColor();
      progress = false;
    } else if (!process.stdout.isTTY) {
      // stdout is being piped, don't log non-errors or progress bars
      progress = false;
      loglevel = 'error';
    } else if (process.stderr.isTTY) {
      log.enableColor();
      log.enableUnicode();
    }

    Object.defineProperty(this, 'envDefaults', {
      value: {
        ci: isCI,
        progress,
        loglevel,
      },
    });
  }

  configureOptions() {
    // Command config object normalized to 'command' namespace
    const commandConfig = this.project.config.command || {};

    // The current command always overrides otherCommandConfigs
    const overrides = [this.commandName, ...this.otherCommandConfigs].map((key) => (commandConfig as any)[key]);

    this.options = defaultOptions(
      // CLI flags, which if defined overrule subsequent values
      this.argv,
      // Namespaced command options from `lerna.json`
      ...overrides,
      // Global options from `lerna.json`
      this.project.config,
      // Environmental defaults prepared in previous step
      this.envDefaults
    );

    if (this.options.verbose && this.options.loglevel !== 'silly') {
      this.options.loglevel = 'verbose';
    }
  }

  configureProperties() {
    const { concurrency, sort, maxBuffer } = this.options;

    this.concurrency = Math.max(1, +concurrency || DEFAULT_CONCURRENCY);
    this.toposort = sort === undefined || sort;

    this.execOpts = {
      cwd: this.project.rootPath ?? '',
      maxBuffer,
    };
  }

  configureLogging() {
    const { loglevel } = this.options;

    if (loglevel) {
      log.level = loglevel;
    }

    // handle log.success()
    log.addLevel('success', 3001, { fg: 'green', bold: true });

    // create logger that subclasses use
    Object.defineProperty(this, 'logger', {
      value: log.newGroup(this.commandName),
    });

    // emit all buffered logs at configured level and higher
    log.resume();
  }

  enableProgressBar() {
    /* v8 ignore if */
    if (this.options.progress !== false) {
      log.enableProgress();
    }
  }

  gitInitialized() {
    const opts: SyncOptions = {
      cwd: this.project.rootPath ?? '',
      // don't throw, just want boolean
      reject: false,
      // only return code, no stdio needed
      stdio: 'ignore',
    };
    const gitCommand = 'git';
    const gitArgs = ['rev-parse'];

    if ((this.options as unknown as PublishCommandOption).dryRun) {
      logExecCommand(gitCommand, gitArgs);
      return true;
    }
    return execaSync(gitCommand, gitArgs, opts).exitCode === 0;
  }

  runValidations() {
    if ((this.options.since !== undefined || this.requiresGit) && !this.gitInitialized()) {
      throw new ValidationError(
        'ENOGIT',
        "The git binary was not found, this is not a git repository, or you git doesn't have the right ownership. Run `git rev-parse` to get more details."
      );
    }

    if (!this.project.manifest) {
      throw new ValidationError('ENOPKG', 'No `package.json` file found, make sure it exist in the root of your project.');
    }

    if (this.project.configNotFound) {
      throw new ValidationError('ENOLERNA', '`lerna.json` does not exist, have you run `lerna init`?');
    }

    if (!this.project.version) {
      throw new ValidationError(
        'ENOVERSION',
        'Required property `version` does not exist in `lerna.json`, make sure to provide one of two modes (fixed or independent). For example "version": "independent" OR "version": "1.0.0"'
      );
    }

    if ((this.options as InitCommandOption).independent && !this.project.isIndependent()) {
      throw new ValidationError(
        'EVERSIONMODE',
        dedent`
          You ran lerna-lite with --independent or -i, but the repository is not set to independent mode.
          To use independent mode you need to set lerna.json's "version" property to "independent".
          Then you won't need to pass the --independent or -i flags.
        `
      );
    }
  }

  runPreparations(): Promise<any> | void {
    if (!this.composed && this.project.isIndependent()) {
      // composed commands have already logged the independent status
      log.info('versioning', 'independent');
    }

    if (!this.composed && this.options.ci) {
      log.info('ci', 'enabled');
    }

    let chain: Promise<any> = Promise.resolve();

    if (this.commandName !== 'info') {
      chain = chain.then(() => this.project.getPackages());
      chain = chain.then((packages) => {
        const { graphType } = this.options.command?.[this.commandName] ?? {};
        this.packageGraph = new PackageGraph(packages || [], graphType ?? 'allDependencies', 'auto', this.options.npmClient);
        return getFilteredPackages(this.packageGraph, this.execOpts, this.options).then((filteredPackages: Package[]) => {
          this.packageGraph = new PackageGraph(
            filteredPackages || [],
            graphType ?? 'allDependencies',
            'auto',
            this.options.npmClient
          );
        });
      });
    }

    return chain;
  }

  async runCommand() {
    return Promise.resolve()
      .then(() => this.initialize())
      .then((proceed) => {
        if (proceed !== false) {
          return this.execute();
        }
        // early exits set their own exitCode (if non-zero)
      });
  }

  initialize(): any {
    throw new ValidationError(this.commandName, 'initialize() needs to be implemented.');
  }

  execute(): any {
    throw new ValidationError(this.commandName, 'execute() needs to be implemented.');
  }
}

// _.defaults(), but simplified:
//  * All inputs are plain objects
//  * Only own keys, not inherited
function defaultOptions(...sources: any) {
  const options: any = {};

  for (const source of sources) {
    if (source !== null && source !== undefined) {
      for (const key of Object.keys(source)) {
        if (options[key] === undefined) {
          options[key] = source[key];
        }
      }
    }
  }

  return options;
}