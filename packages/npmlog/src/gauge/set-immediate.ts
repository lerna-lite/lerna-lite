/* v8 ignore start */
export function setImmediateFn(...args: any) {
  try {
    return window.setImmediate(args);
  } catch (_) {
    return process.nextTick(args);
  }
}
/* v8 ignore stop */
