// FAIL LOUDLY on unhandled promise rejections / errors
// process.on('unhandledRejection', (reason) => {
//   // eslint-disable-next-line no-console
//   console.log(`FAILED TO HANDLE PROMISE REJECTION`);
//   throw reason;
// });

//
// Extra Matchers

/**
 * add `expect.toBeFunction()` matcher (which exists in jest-extended)
 * @see: https://github.com/vitest-dev/vitest/blob/main/docs/guide/extending-matchers.md
 */
expect.extend({
  toBeFunction: (received) => {
    return {
      message: () => `expected ${received} to be typeof function`,
      pass: typeof received === 'function',
    };
  },
});
