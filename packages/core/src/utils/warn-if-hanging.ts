import log from 'npmlog';

import { getChildProcessCount } from '../child-process';

export function warnIfHanging() {
  const childProcessCount = getChildProcessCount();

  if (childProcessCount > 0) {
    log.warn(
      'complete',
      `Waiting for ${childProcessCount} child ` +
      `process${childProcessCount === 1 ? '' : 'es'} to exit. ` +
      'CTRL-C to exit immediately.'
    );
  }
}
