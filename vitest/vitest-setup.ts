import { expect } from 'vitest';

//
// Extra Matchers

/**
 * add `expect.toBeFunction()` matcher (which exists in jest-extended)
 * @see: https://vitest.dev/api/expect.html#expect-extend
 */
expect.extend({
  toBeFunction: (received) => {
    return {
      message: () => `expected ${received} to be typeof function`,
      pass: typeof received === 'function',
    };
  },
});
