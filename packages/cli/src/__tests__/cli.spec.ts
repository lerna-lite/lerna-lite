import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@lerna-lite/npmlog', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CLI', () => {
  let lernaMock;
  let exitSpy;

  beforeEach(() => {
    vi.resetModules();
    lernaMock = vi.fn();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    exitSpy.mockRestore();
  });

  it('should log a message when using local version', async () => {
    vi.doMock('../import-local-shim.js', () => ({
      importLocal: vi.fn(() => true),
    }));
    const { main } = await import('../cli.js');
    const { importLocal } = await import('../import-local-shim.js');
    const { log } = await import('@lerna-lite/npmlog');

    try {
      await main();
    } catch (err) {
      if (!(err instanceof Error && err.message === 'process.exit called')) throw err;
    }

    expect(importLocal).toHaveBeenCalled();
    expect(log.info).toHaveBeenCalledWith('cli', 'using local version of lerna');
  });

  it('should call lerna CLI when lerna not found locally', async () => {
    vi.doMock('../lerna-entry.js', () => ({
      lerna: lernaMock,
    }));
    vi.doMock('../import-local-shim.js', () => ({
      importLocal: vi.fn(() => false),
    }));
    const { main } = await import('../cli.js');
    const { importLocal } = await import('../import-local-shim.js');

    try {
      await main();
    } catch (err) {
      if (!(err instanceof Error && err.message === 'process.exit called')) throw err;
    }

    expect(importLocal).toHaveBeenCalled();
    expect(lernaMock).toBeTruthy();
    expect(lernaMock).toHaveBeenCalled();
  });
});
