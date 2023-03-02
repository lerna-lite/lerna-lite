import { Command, CommandType, exec, InitCommandOption, ProjectConfig } from '@lerna-lite/core';
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
  lernaVersion = '';

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

  async execute() {
    await this.ensurePackageJSON();
    await this.ensureLernaConfig();
    await this.ensurePackagesDir();
    this.logger.success('', 'Initialized Lerna files');
  }

  async ensurePackageJSON() {
    if (!this.project.manifest) {
      this.logger.info('', 'Creating package.json');

      // initialize with default indentation so write-pkg doesn't screw it up with tabs
      await writeJsonFile(
        path.join(this.project.rootPath, 'package.json'),
        { name: 'root', private: true },
        { indent: 2 }
      );
    } else {
      this.logger.info('', 'Updating package.json');
    }

    const rootPkg = this.project.manifest;
    let targetDependencies: { [depName: string]: string };

    if (rootPkg.dependencies?.[LERNA_CLI_PKG_NAME]) {
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

    // add workspace packages in package.json when `useWorkspaces` enabled
    if (this.options.useWorkspaces && !rootPkg.workspaces) {
      rootPkg.workspaces = ['packages/*'];
    }

    return rootPkg.serialize();
  }

  ensureLernaConfig() {
    // config already defaulted to empty object in Project constructor
    const { config, version: projectVersion } = this.project;

    let version;

    if (this.options.independent) {
      version = 'independent';
    } else if (projectVersion) {
      version = projectVersion;
    } else {
      version = '0.0.0';
    }

    const logMessage = !projectVersion ? 'Creating lerna.json' : 'Updating lerna.json';
    this.logger.info('', logMessage);

    delete config[LERNA_CLI_PKG_NAME]; // no longer relevant

    if (this.exact) {
      // ensure --exact is preserved for future init commands
      const commandConfig = config.command || (config.command = {});
      const initConfig = commandConfig.init || (commandConfig.init = {});

      initConfig.exact = true;
    }

    const lernaConfig: Partial<ProjectConfig> = {
      $schema: 'node_modules/@lerna-lite/cli/schemas/lerna-schema.json',
      version,
    };

    if (this.options.useWorkspaces) {
      lernaConfig.useWorkspaces = true;
    } else {
      lernaConfig.packages = ['packages/*'];
    }
    Object.assign(config, lernaConfig);

    return this.project.serializeConfig();
  }

  ensurePackagesDir() {
    this.logger.info('', 'Creating packages directory');

    return pMap(this.project.packageParentDirs, (dir) => fs.mkdirp(dir));
  }
}
