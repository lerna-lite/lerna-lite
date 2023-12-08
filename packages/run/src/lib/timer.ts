export function timer() {
  /* v8 ignore next 3 */
  if (process.env.LERNA_INTEGRATION) {
    return () => 0;
  }

  const startMillis = Date.now();
  return () => Date.now() - startMillis;
}
