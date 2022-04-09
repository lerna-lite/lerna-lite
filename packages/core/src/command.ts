import cloneDeep from 'clone-deep';
import dedent from 'dedent';
import execa from 'execa';
import log, { Logger } from 'npmlog';
import os from 'os';

import { cleanStack } from './utils/clean-stack';
import { logPackageError } from './utils/log-package-error';
import { warnIfHanging } from './utils/warn-if-hanging';
import { writeLogFile } from './utils/write-log-file';
import { Project } from './project/project';
import { ValidationError } from './validation-error';
import { ExecOpts } from './models';
import { PackageGraph } from './package-graph/package-graph';
import { logExecCommand } from './child-process';

// maxBuffer value for running exec
const DEFAULT_CONCURRENCY = os.cpus().length;

export class Command {
  argv: any;
  concurrency!: number;
  envDefaults: any;
  sort: any;
  toposort?: number;

  execOpts!: ExecOpts;
  name = '';
  composed;
  logger!: Logger;
  options: any;
  project!: Project;
  packageGraph!: PackageGraph;
  runner?: Promise<any>;

  constructor(_argv: any) {
    log.pause();
    log.heading = 'lerna-lite';

    const argv = cloneDeep(_argv);
    log.silly('argv', argv);

    // 'FooCommand' => 'foo'
    this.name = this.constructor.name.replace(/Command$/, '').toLowerCase();

    // composed commands are called from other commands, like publish -> version
    this.composed = typeof argv.composed === 'string' && argv.composed !== this.name;

    if (!this.composed) {
      // composed commands have already logged the lerna version
      log.notice('cli', `v${argv.lernaVersion}`);
    }

    // launch the command
    let runner = new Promise((resolve, reject) => {
      // run everything inside a Promise chain
      let chain: Promise<any> = Promise.resolve();

      chain = chain.then(() => this.project = new Project(argv.cwd));
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
    /* istanbul ignore else */
    if (argv.onResolved || argv.onRejected) {
      runner = runner.then(argv.onResolved, argv.onRejected);

      // when nested, never resolve inner with outer callbacks
      delete argv.onResolved; // eslint-disable-line no-param-reassign
      delete argv.onRejected; // eslint-disable-line no-param-reassign
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

  /* istanbul ignore next */
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
    // eslint-disable-next-line global-require
    const ci = require('is-ci');
    let loglevel;
    let progress;

    /* istanbul ignore next */
    if (ci || !process.stderr.isTTY || process.env.TERM === 'dumb') {
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
        ci,
        progress,
        loglevel,
      },
    });
  }

  configureOptions() {
    // Command config object normalized to 'command' namespace
    const commandConfig = this.project.config.command || {};

    // The current command always overrides otherCommandConfigs
    const overrides = [this.name, ...this.otherCommandConfigs].map((key) => (commandConfig as any)[key]);

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
      value: log.newGroup(this.name),
    });

    // emit all buffered logs at configured level and higher
    log.resume();
  }

  enableProgressBar() {
    /* istanbul ignore next */
    if (this.options.progress !== false) {
      log.enableProgress();
    }
  }

  gitInitialized() {
    const opts: execa.SyncOptions<string> = {
      cwd: this.project.rootPath ?? '',
      // don't throw, just want boolean
      reject: false,
      // only return code, no stdio needed
      stdio: 'ignore',
    };
    const gitCommand = 'git';
    const gitArgs = ['rev-parse'];

    if (this.options.gitDryRun) {
      logExecCommand(gitCommand, gitArgs);
      return true;
    }
    return execa.sync(gitCommand, gitArgs, opts).exitCode === 0;
  }

  runValidations() {
    if ((this.options.since !== undefined || this.requiresGit) && !this.gitInitialized()) {
      throw new ValidationError('ENOGIT', 'The git binary was not found, or this is not a git repository.');
    }

    if (!this.project.manifest) {
      throw new ValidationError('ENOPKG', 'No `package.json` file found, make sure it exist in the root of your project.');
    }

    if (!this.project.version) {
      throw new ValidationError('ENOLERNA', 'No `lerna.json` file exist, please create one in the root of your project.');
    }

    if (this.options.independent && !this.project.isIndependent()) {
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

  runPreparations() {
    if (!this.composed && this.project.isIndependent()) {
      // composed commands have already logged the independent status
      log.info('versioning', 'independent');
    }

    if (!this.composed && this.options.ci) {
      log.info('ci', 'enabled');
    }

    let chain: Promise<any> = Promise.resolve();

    chain = chain.then(() => this.project.getPackages());
    chain = chain.then((packages) => {
      this.packageGraph = new PackageGraph(packages || []);
    });

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

  initialize(): any | Promise<any> {
    throw new ValidationError(this.name, 'initialize() needs to be implemented.');
  }

  execute(): any | Promise<any> {
    throw new ValidationError(this.name, 'execute() needs to be implemented.');
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
