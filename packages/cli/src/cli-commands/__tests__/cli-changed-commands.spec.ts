jest.mock('@lerna-lite/changed', () => null);
const cliChanged = require('../cli-changed-commands');

describe('ChangedCommand CLI options', () => {
  it('should log a console error when ChangedCommand is not provided', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await cliChanged.handler();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"@lerna-lite/changed" is optional and was not found.')
    );
  });
});
