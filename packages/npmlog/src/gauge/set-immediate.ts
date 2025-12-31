/* v8 ignore next */
export function setImmediateFn(...args: any) {
  try {
    // oxlint-disable-next-line no-implied-eval
    return window.setImmediate(args);
  } catch (_) {
    return process.nextTick(args);
  }
}
