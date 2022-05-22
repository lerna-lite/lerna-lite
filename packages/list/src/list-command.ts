import { Command, CommandType, ListCommandOption, logOutput, } from '@lerna-lite/core';
import { getFilteredPackages } from '@lerna-lite/exec-run-common';
import { FilterOptions } from '@lerna-lite/exec-run-common/src';
import { listable } from './lib/index';

export function factory(argv: ListCommandOption) {
  return new ListCommand(argv);
}

export class ListCommand extends Command<ListCommandOption & FilterOptions> {
  /** command name */
  name = 'list' as CommandType;
  result?: { count: number; text: string; };

  constructor(argv: ListCommandOption) {
    super(argv);
  }

  get requiresGit() {
    return false;
  }

  async initialize() {
    const filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, this.options);
    this.result = listable.format(filteredPackages, this.options);
  }

  execute() {
    // piping to `wc -l` should not yield 1 when no packages matched
    if (this.result?.text.length) {
      logOutput(this.result.text);
    }

    this.logger.success(
      'found',
      '%d %s',
      this.result?.count,
      this.result?.count === 1 ? 'package' : 'packages'
    );
  }
}
