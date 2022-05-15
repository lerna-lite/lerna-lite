import { Command, CommandType, exec, InitCommandOption, } from '@lerna-lite/core';
import fs from 'fs-extra';
import path from 'path';
import pMap from 'p-map';
import writeJsonFile from 'write-json-file';

const LERNA_CLI_PKG_NAME = '@lerna-lite/cli';

export function factory(argv: InitCommandOption) {
  return new InitCommand(argv);
}

export class InitCommand extends Command<InitCommandOption> {
  /** command name */
  name = 'init' as CommandType;
  exact?: boolean = false;
  lernaVersion?: string = '';

  constructor(argv: InitCommandOption) {
    super(argv);
  }

  get requiresGit() {
    return false;
  }

  runValidations() {
    this.logger.verbose(this.name, 'skipping validations');
  }

  runPreparations() {
    this.logger.verbose(this.name, 'skipping preparations');
  }

  initialize() {
    this.exact = this.options.exact;
    this.lernaVersion = this.options.lernaVersion;

    if (!this.gitInitialized()) {
      this.logger.info('', 'Initializing Git repository');

      return exec('git', ['init'], this.execOpts);
    }
  }

  execute() {
    let chain: Promise<any> = Promise.resolve();

    chain = chain.then(() => this.ensurePackageJSON());
    chain = chain.then(() => this.ensureLernaConfig());
    chain = chain.then(() => this.ensurePackagesDir());

    return chain.then(() => {
      this.logger.success('', 'Initialized Lerna files');
    });
  }

  ensurePackageJSON() {
    let chain: Promise<any> = Promise.resolve();

    if (!this.project.manifest) {
      this.logger.info('', 'Creating package.json');

      // initialize with default indentation so write-pkg doesn't screw it up with tabs
      chain = chain.then(() =>
        writeJsonFile(
          path.join(this.project.rootPath, 'package.json'),
          {
            name: 'root',
            private: true,
          },
          { indent: 2 }
        )
      );
    } else {
      this.logger.info('', 'Updating package.json');
    }

    chain = chain.then(() => {
      const rootPkg = this.project.manifest;

      let targetDependencies;

      if ((rootPkg.dependencies as any)?.[LERNA_CLI_PKG_NAME]) {
        // lerna is a dependency in the current project
        targetDependencies = rootPkg.dependencies;
      } else {
        // lerna is a devDependency or no dependency, yet
        if (!rootPkg.devDependencies) {
          // mutate raw JSON object
          rootPkg.set('devDependencies', {});
        }

        targetDependencies = rootPkg.devDependencies;
      }

      targetDependencies[LERNA_CLI_PKG_NAME] = this.exact ? this.lernaVersion : `^${this.lernaVersion}`;

      return rootPkg.serialize();
    });

    return chain;
  }

  ensureLernaConfig() {
    // config already defaulted to empty object in Project constructor
    const { config, version: projectVersion } = this.project;

    let version = '';

    if (this.options.independent) {
      version = 'independent';
    } else if (projectVersion) {
      version = projectVersion;
    } else {
      version = '0.0.0';
    }

    if (!projectVersion) {
      this.logger.info('', 'Creating lerna.json');
    } else {
      this.logger.info('', 'Updating lerna.json');
    }

    delete (config as any)[LERNA_CLI_PKG_NAME]; // no longer relevant

    if (this.exact) {
      // ensure --exact is preserved for future init commands
      const commandConfig = config.command || (config.command = {} as any);
      const initConfig = commandConfig.init || (commandConfig.init = {});

      initConfig.exact = true;
    }

    Object.assign(config, {
      version,
    });

    return this.project.serializeConfig();
  }

  async ensurePackagesDir() {
    this.logger.info('', 'Creating packages directory');

    return pMap(await this.project.packageParentDirs, (dir) => fs.mkdirp(dir));
  }
}
