import log from 'npmlog';

const execSyncMock = jest.fn();

jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  execSync: execSyncMock,
  logOutput: jest.requireActual('../../../../core/src/__mocks__/output').logOutput,
  collectUpdates: jest.requireActual('../../../../core/src/__mocks__/collect-updates').collectUpdates,
}));

// mocked modules
import { execSync } from '@lerna-lite/core';

// file under test
import { getLastCommit } from '../../lib/get-last-commit';

describe('get-last-commit', () => {
  (execSync as jest.Mock).mockImplementation(() => 'v1.0.0\nv1.0.1');

  it('should call getLastCommit() method with hasTags returning true', async () => {
    const sillySpy = jest.spyOn(log, 'silly');
    const verboseSpy = jest.spyOn(log, 'verbose');

    getLastCommit({ cwd: 'test' });

    expect(sillySpy).toHaveBeenCalledWith('git', 'getLastTagInBranch');
    expect(execSync).toHaveBeenLastCalledWith('git', ['describe', '--tags', '--abbrev=0'], { cwd: 'test' });
    expect(verboseSpy).toHaveBeenCalledWith('hasTags', `true`);
  });

  it('should call getLastCommit() method with hasTags returning false', async () => {
    execSyncMock.mockReturnValue(false);
    const sillySpy = jest.spyOn(log, 'silly');
    const verboseSpy = jest.spyOn(log, 'verbose');

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
    const warnSpy = jest.spyOn(log, 'warn');
    const verboseSpy = jest.spyOn(log, 'verbose');

    try {
      getLastCommit({ cwd: 'test' });
    } catch (e) {
      expect(e.message).toBe('some error');
      expect(warnSpy).toHaveBeenCalledWith('ENOTAGS', 'No git tags were reachable from this branch!');
      expect(verboseSpy).toHaveBeenCalledWith('hasTags error', someError);
    }
  });
});
