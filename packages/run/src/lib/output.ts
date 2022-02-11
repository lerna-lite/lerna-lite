/* eslint-disable no-console */
import log from 'npmlog';

// istanbul ignore next
export function output(...args: string[]) {
  log.clearProgress();
  console.log(...args);
  log.showProgress();
}
