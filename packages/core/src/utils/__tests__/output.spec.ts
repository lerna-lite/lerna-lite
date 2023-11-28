import { describe, expect, it, vi } from 'vitest';

import { logOutput } from '../output';
import log from 'npmlog';

describe('logOutput method', () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  it('should console log output when called', () => {
    const clearSpy = vi.spyOn(log, 'clearProgress');
    const showSpy = vi.spyOn(log, 'showProgress');

    logOutput('arg1');

    expect(clearSpy).toHaveBeenCalled();
    expect(showSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('arg1');
  });
});
