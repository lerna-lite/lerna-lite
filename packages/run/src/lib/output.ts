/* eslint-disable no-console */
import log from 'npmlog';

// istanbul ignore next
export function output(...args) {
  log.clearProgress();
  console.log(...args);
  log.showProgress();
}
