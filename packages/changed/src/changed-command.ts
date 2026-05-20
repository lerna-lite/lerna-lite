import type { ChangedCommandOption, CommandType, ListCommandOption, UpdateCollectorOptions } from '@lerna-lite/core';
import { collectUpdates, Command, logOutput } from '@lerna-lite/core';
import { listable } from '@lerna-lite/listable';

export function factory(argv: ChangedCommandOption & ListCommandOption) {
  return new ChangedCommand(argv);
}

export class ChangedCommand extends Command<ChangedCommandOption & ListCommandOption> {
  /** command name */
  name = 'changed' as CommandType;
  result?: { count: number; text: string };

  constructor(argv: ChangedCommandOption & ListCommandOption) {
    super(argv);
  }

  get otherCommandConfigs() {
    // back-compat
    return ['version', 'publish'];
  }

  async initialize() {
    if (this.options.conventionalGraduate) {
      // provide artificial --conventional-commits so --conventional-graduate works
      this.options.conventionalCommits = true;

      if (this.options.forcePublish) {
        this.logger.warn('option', '--force-publish superseded by --conventional-graduate');
      }
    }

    const updates = collectUpdates(
      this.packageGraph.rawPackageList,
      this.packageGraph,
      this.execOpts,
      this.options as UpdateCollectorOptions
    );

    this.result = listable.format(
      updates.map((node) => node.pkg),
      this.options
    );

    if (this.result.count === 0) {
      this.logger.info('', 'No changed packages found');

      process.exitCode = 1;

      // prevents execute()
      return false;
    }
  }

  execute() {
    // ensure single-line outputs do not include a trailing newline
    const out = this.result?.text;
    logOutput(out && typeof out === 'string' ? out.replace(/\n$/, '') : out);

    this.logger.success('found', '%d %s ready to publish', this.result?.count, this.result?.count === 1 ? 'package' : 'packages');
  }
}
