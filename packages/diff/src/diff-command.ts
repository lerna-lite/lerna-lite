import { Command, CommandType, DiffCommandOption, Package, spawn, ValidationError } from '@lerna-lite/core';

import { getLastCommit } from './lib/get-last-commit';
import { hasCommit } from './lib/has-commit';

export function factory(argv: DiffCommandOption) {
  return new DiffCommand(argv);
}

export class DiffCommand extends Command<DiffCommandOption> {
  /** command name */
  name = 'diff' as CommandType;

  args: string[] = [];

  constructor(argv: DiffCommandOption) {
    super(argv);
  }

  initialize() {
    let targetPackage: Package | undefined = undefined;
    const packageName = this.options.pkgName;

    if (packageName) {
      targetPackage = this.packageGraph.get(packageName);

      if (!targetPackage) {
        throw new ValidationError('ENOPKG', `Cannot diff, the package '${packageName}' does not exist.`);
      }
    }

    if (!hasCommit(this.execOpts)) {
      throw new ValidationError('ENOCOMMITS', 'Cannot diff, there are no commits in this repository yet.');
    }

    const args = ['diff', getLastCommit(this.execOpts), '--color=auto'];

    if (targetPackage) {
      args.push('--', targetPackage.location);
    } else {
      args.push('--', ...this.project.packageParentDirs);
    }

    if (this.options.ignoreChanges) {
      this.options.ignoreChanges.forEach((ignorePattern) => {
        // https://stackoverflow.com/a/21079437
        args.push(`:(exclude,glob)${ignorePattern}`);
      });
    }

    this.args = args;
  }

  execute() {
    return spawn('git', this.args, this.execOpts).catch((err) => {
      if (err.exitCode) {
        // quitting the diff viewer is not an error
        throw err;
      }
    });
  }
}
