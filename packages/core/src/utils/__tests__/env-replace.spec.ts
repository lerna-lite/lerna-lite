import { envReplace } from '../env-replace';

describe('env-replace()', () => {
  it('should throw an error when there are no env variable defined or found', () => {
    const input = 'http://registry.npmjs.org/:_authToken=${UNKNOWN_TOKEN}';

    expect(() => envReplace(input)).toThrow();
  });

  it('should return the same input when not a string', () => {
    const env = Object.assign({}, process.env);
    process.env.SOME_TOKEN = '123';
    const input = undefined;
    const output = envReplace(input);

    expect(output).toBeUndefined();
  });

  it('should replace any {ENV} variable found in the string', () => {
    const env = Object.assign({}, process.env);
    process.env.SOME_TOKEN = '123';
    const input = 'http://registry.npmjs.org/:_authToken=${SOME_TOKEN}';
    const output = envReplace(input);

    expect(output).toBe('http://registry.npmjs.org/:_authToken=123');
  });
});