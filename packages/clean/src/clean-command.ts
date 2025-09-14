import { relative } from 'node:path';

import type { CleanCommandOption, CommandType, Package } from '@lerna-lite/core';
import { Command, getFilteredPackages, promptConfirmation, pulseTillDone } from '@lerna-lite/core';
import pMap from 'p-map';

import { removeDir } from './lib/remove-dir.js';

export function factory(argv: CleanCommandOption) {
  return new CleanCommand(argv);
}

export class CleanCommand extends Command<CleanCommandOption> {
  /** command name */
  name = 'clean' as CommandType;
  directoriesToDelete: string[] = [];

  constructor(argv: CleanCommandOption) {
    super(argv);
  }

  get requiresGit() {
    return false;
  }

  async initialize() {
    let chain: Promise<any> = Promise.resolve();

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then((filteredPackages: Package[]) => {
      this.directoriesToDelete = filteredPackages.map((pkg) => pkg.nodeModulesLocation);
    });

    return chain.then(() => {
      if (this.options.yes) {
        return true;
      }

      this.logger.info('', 'Removing the following directories:');
      this.logger.info('clean', this.directoriesToDelete.map((dir) => relative(this.project.rootPath, dir)).join('\n'));

      return promptConfirmation('Proceed?');
    });
  }

  execute() {
    this.enableProgressBar();

    const tracker = this.logger.newItem('clean');
    const mapper = (dirPath) => {
      tracker.info('clean', 'removing', dirPath);

      return pulseTillDone(Promise.resolve(removeDir(dirPath))).then(() => {
        tracker.completeWork(1);
      });
    };

    tracker.addWork(this.directoriesToDelete.length);

    return pMap(this.directoriesToDelete, mapper, { concurrency: this.concurrency }).then(() => {
      tracker.finish();
      this.logger.success('clean', 'finished');
    });
  }
}
