import { logOutput } from '../output';
import log from 'npmlog';

describe('logOutput method', () => {
  it('should console log output when called', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    const clearSpy = jest.spyOn(log, 'clearProgress');
    const showSpy = jest.spyOn(log, 'showProgress');

    logOutput('arg1');

    expect(clearSpy).toHaveBeenCalled();
    expect(showSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('arg1');
  });
});