import { cleanStack } from '../clean-stack'
describe('clean-stack()', () => {
  it('should call cleanStack() and expect the method to split by newline and return the first substring', () => {
    const className = 'VersionCommand';
    const err = {
      message: 'some error',
      stack: `some error happened in the stack\n` + `    at VersionCommand.runCommand init() line 123`
    }
    const output = cleanStack(err, className);

    expect(output).toBe('some error happened in the stack');
  });

  it('should call cleanStack() and the entire error object to be returned when cutoff is found at index 0', () => {
    const className = 'VersionCommand';
    const err = {
      message: 'some error',
      stack: `    at VersionCommand.runCommand init() line 123`
    }
    const output = cleanStack(err, className);

    expect(output).toEqual(err);
  });
});