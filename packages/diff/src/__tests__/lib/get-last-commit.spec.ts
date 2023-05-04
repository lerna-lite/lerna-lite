import { describe, expect, it, Mock, vi } from 'vitest';

const { execSyncMock } = vi.hoisted(() => ({ execSyncMock: vi.fn() }));
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
  execSync: execSyncMock,
  logOutput: (await vi.importActual<any>('../../../../core/src/__mocks__/output')).logOutput,
  collectUpdates: (await vi.importActual<any>('../../../../core/src/__mocks__/collect-updates')).collectUpdates,
}));

import log from 'npmlog';

// mocked modules
import { execSync } from '@lerna-lite/core';

// file under test
import { getLastCommit } from '../../lib/get-last-commit';

describe('get-last-commit', () => {
  (execSync as Mock).mockImplementation(() => 'v1.0.0\nv1.0.1');

  it('should call getLastCommit() method with hasTags returning true', async () => {
    const sillySpy = vi.spyOn(log, 'silly');
    const verboseSpy = vi.spyOn(log, 'verbose');

    getLastCommit({ cwd: 'test' });

    expect(sillySpy).toHaveBeenCalledWith('git', 'getLastTagInBranch');
    expect(execSync).toHaveBeenLastCalledWith('git', ['describe', '--tags', '--abbrev=0'], { cwd: 'test' });
    expect(verboseSpy).toHaveBeenCalledWith('hasTags', `true`);
  });

  it('should call getLastCommit() method with hasTags returning false', async () => {
    execSyncMock.mockReturnValue(false);
    const sillySpy = vi.spyOn(log, 'silly');
    const verboseSpy = vi.spyOn(log, 'verbose');

    getLastCommit({ cwd: 'test' });

    expect(sillySpy).toHaveBeenCalledWith('git', 'getFirstCommit');
    expect(execSync).toHaveBeenLastCalledWith('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: 'test' });
    expect(verboseSpy).toHaveBeenCalledWith('hasTags', `false`);
  });

  it('should call getLastCommit() method with hasTags throwing an error', async () => {
    const someError = new Error('some error');
    execSyncMock.mockImplementation(() => {
      throw someError;
    });
    const warnSpy = vi.spyOn(log, 'warn');
    const verboseSpy = vi.spyOn(log, 'verbose');

    try {
      getLastCommit({ cwd: 'test' });
    } catch (e) {
      expect(e.message).toBe('some error');
      expect(warnSpy).toHaveBeenCalledWith('ENOTAGS', 'No git tags were reachable from this branch!');
      expect(verboseSpy).toHaveBeenCalledWith('hasTags error', someError);
    }
  });
});
