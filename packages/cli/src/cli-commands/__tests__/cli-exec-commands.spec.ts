jest.mock('@lerna-lite/exec', () => null);
const cliExec = require('../cli-exec-commands');

describe('ExecCommand CLI options', () => {
  it('should log a console error when ExecCommand is not provided', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await cliExec.handler();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"@lerna-lite/exec" is optional and was not found.')
    );
  });
});
