import log from 'npmlog';

export function logOutput(...args: any) {
  log.clearProgress();
  console.log(...args);
  log.showProgress();
}
