import { describe, expect, it } from 'vitest';

import { envReplace } from '../env-replace.js';

describe('env-replace()', () => {
  it('should throw an error when there are no env variable defined or found', () => {
    const input = 'http://registry.npmjs.org/:_authToken=${UNKNOWN_TOKEN}';

    expect(() => envReplace(input)).toThrow('Failed to replace env in config');
  });

  it('should return the same input when not a string', () => {
    Object.assign({}, process.env);
    process.env.SOME_TOKEN = '123';
    const input = undefined;
    const output = envReplace(input);

    expect(output).toBeUndefined();
  });

  it('should replace any {ENV} variable found in the string', () => {
    Object.assign({}, process.env);
    process.env.SOME_TOKEN = '123';
    const input = 'http://registry.npmjs.org/:_authToken=${SOME_TOKEN}';
    const output = envReplace(input);

    expect(output).toBe('http://registry.npmjs.org/:_authToken=123');
  });
});
