jest.mock('import-local');

jest.mock('../lerna-entry', () => ({
  constructor: jest.fn(),
  lerna: jest.fn(),
}));

import importLocal from 'import-local';
import log from 'npmlog';

describe('CLI', () => {
  afterEach(() => {
    jest.resetModules();
  });

  beforeEach(() => {
    jest.mock('import-local');
  });

  it('should log a message when using local version', async () => {
    (importLocal as jest.Mock).mockImplementation(() => true);
    const spy = jest.spyOn(log, 'info');

    await import('../cli');

    expect(importLocal).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('cli', 'using local version of lerna');
  });

  it('should call lerna CLI when lerna not found locally', async () => {
    let { lerna } = await import('../lerna-entry');

    await import('../cli');

    expect(lerna).toBeTruthy();
    expect(lerna).toHaveBeenCalled();
  });
});
