import { log } from '@lerna-lite/npmlog';
import { describe, expect, it, vi } from 'vitest';

import { logOutput } from '../output.js';

describe('logOutput method', () => {
  it('should console log output when called', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const clearSpy = vi.spyOn(log, 'clearProgress');
    const showSpy = vi.spyOn(log, 'showProgress');

    logOutput('arg1');

    expect(clearSpy).toHaveBeenCalled();
    expect(showSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('arg1');
  });
});
