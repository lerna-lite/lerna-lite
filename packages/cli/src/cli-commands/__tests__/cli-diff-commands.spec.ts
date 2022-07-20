jest.mock('@lerna-lite/diff', () => null);
import cliDiff from '../cli-diff-commands';

describe('DiffCommand CLI options', () => {
  it('should log a console error when DiffCommand is not provided', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await cliDiff.handler(undefined as any);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`"@lerna-lite/diff" is optional and was not found.`),
      expect.anything()
    );
  });
});
