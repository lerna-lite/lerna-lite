import 'dotenv/config';
import { argv } from 'yargs';
import log from 'npmlog';

import { formatError, CommandOptions } from '@lerna-lite/core';
import { PublishCommand } from '@lerna-lite/publish';
import { VersionCommand } from '@lerna-lite/version';

try {
  const pkg = require('../package.json');
  log.notice('cli', `version ${pkg?.version ?? ''}`);
  log.warn('deprecated', 'Calling publish or version command this way is now deprecated and will be removed in the next version. Please use "ws-roller" CLI instead.');

  if ((argv as CommandOptions).rollPublish) {
    new PublishCommand(argv);
  } else if ((argv as CommandOptions).rollVersion) {
    new VersionCommand(argv);
  } else {
    log.error('commands', 'You can only run this project via 1 of the following 2 commands: --roll-publish OR --roll-version');
  }
} catch (err: any) {
  formatError(err);
}
