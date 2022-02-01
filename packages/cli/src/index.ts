import 'dotenv/config';
import { argv } from 'yargs';
import log from 'npmlog';

import { formatError, CommandOptions } from '@ws-conventional-version-roller/core';
import { PublishCommand } from '@ws-conventional-version-roller/publish';
import { VersionCommand } from '@ws-conventional-version-roller/version';

try {
  const pkg = require('../package.json');
  log.notice('cli', `version ${pkg?.version ?? ''}`);

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
