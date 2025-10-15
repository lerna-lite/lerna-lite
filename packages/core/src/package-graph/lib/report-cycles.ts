import { log } from '@lerna-lite/npmlog';
import { ValidationError } from '../../validation-error.js';

export function reportCycles(paths, rejectCycles) {
  if (!paths.length) {
    return;
  }

  const cycleMessage = ['Dependency cycles detected, you should fix these!'].concat(paths).join('\n');

  if (rejectCycles) {
    throw new ValidationError('ECYCLE', cycleMessage);
  }

  log.warn('ECYCLE', cycleMessage);
}
