export function setImmediateFn(...args: any) {
  try {
    return window.setImmediate(args);
  } catch (_) {
    return process.nextTick(args);
  }
}
