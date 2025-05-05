import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('import-local');

const lernaMock = vi.fn();
vi.mock('../lerna-entry.js', () => ({
  constructor: vi.fn(),
  lerna: lernaMock,
}));

import { log } from '@lerna-lite/npmlog';
import importLocal from 'import-local';

describe('CLI', () => {
  afterEach(() => {
    vi.resetModules();
  });

  beforeEach(() => {
    vi.mock('import-local');
  });

  it('should log a message when using local version', async () => {
    (importLocal as Mock).mockImplementation(() => true);
    const spy = vi.spyOn(log, 'info');

    await import('../cli.js');

    expect(importLocal).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('cli', 'using local version of lerna');
  });

  it('should call lerna CLI when lerna not found locally', async () => {
    (importLocal as Mock).mockImplementation(() => false);
    await import('../cli.js');

    expect(lernaMock).toBeTruthy();
    expect(lernaMock).toHaveBeenCalled();
  });
});
