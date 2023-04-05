export function timer() {
  /* c8 ignore next 2 */
  if (process.env.LERNA_INTEGRATION) {
    return () => 0;
  }

  const startMillis = Date.now();
  return () => Date.now() - startMillis;
}
