jest.mock('../../utils/describe-ref');
jest.mock('../../child-process');
jest.mock('../get-github-commits');

import { getGithubCommits } from '../get-github-commits';
import { describeRefSync } from '../../utils/describe-ref';
import { getCommitsSinceLastRelease, getOldestCommitSinceLastTag } from '../get-commits-since-last-release';
import { execSync } from '../../child-process';

const execOpts = { cwd: '/test' };
const tagStub = {
  lastTagName: 'v1.0.0',
  lastVersion: '1.0.0',
  refCount: '1',
  sha: 'deadbeef',
  isDirty: false,
};
const commitsStub = [
  {
    authorName: 'Tester McPerson',
    login: 'tester-mcperson',
    shortHash: 'SHA',
    message: 'fix(stuff): changed something',
  },
];

describe('getCommitsSinceLastRelease', () => {
  beforeEach(() => {
    (describeRefSync as jest.Mock).mockReturnValue(tagStub);
  });

  it('throws an error if used with a remote client other than "github"', async () => {
    (execSync as jest.Mock).mockReturnValue('"deadbeef 2022-07-01T00:01:02-04:00"');
    await expect(getCommitsSinceLastRelease('gitlab', 'durable', 'main', false, execOpts)).rejects.toThrow(
      'Invalid remote client type, "github" is currently the only supported client with the option --changelog-include-commits-client-login.'
    );
  });

  it('should expect commits returned when using "github" when a valid tag is returned', async () => {
    (getGithubCommits as jest.Mock).mockResolvedValue(commitsStub);
    (execSync as jest.Mock).mockReturnValue('"deadbeef 2022-07-01T00:01:02-04:00"');
    const isIndependent = false;
    const result = await getCommitsSinceLastRelease('github', 'durable', 'main', isIndependent, execOpts);

    expect(result).toEqual(commitsStub);
  });

  it('should expect commits returned when using "github" when a valid tag in independent mode is returned', async () => {
    (getGithubCommits as jest.Mock).mockResolvedValue(commitsStub);
    (execSync as jest.Mock).mockReturnValueOnce('"abcbeef 2022-07-01T00:01:02-04:00"');
    const isIndependent = true;
    const result = await getCommitsSinceLastRelease('github', 'durable', 'main', isIndependent, execOpts);

    expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*@*' }, false);
    expect(result).toEqual(commitsStub);
  });
});

describe('getOldestCommitSinceLastTag', () => {
  describe('without tag', () => {
    beforeEach(() => {
      (describeRefSync as jest.Mock).mockReturnValue({
        lastTagName: undefined,
        lastVersion: undefined,
        refCount: '1',
        sha: 'deadbeef',
        isDirty: false,
      });
    });

    it('should return first commit date when describeRefSync() did not return a tag date', async () => {
      const execSpy = (execSync as jest.Mock).mockReturnValueOnce('"abcbeef 2022-07-01T00:01:02-04:00"');
      const result = await getOldestCommitSinceLastTag(execOpts);

      expect(execSpy).toHaveBeenCalledWith(
        'git',
        ['log', '--oneline', '--format="%h %aI"', '--reverse', '--max-parents=0', 'HEAD'],
        execOpts
      );
      expect(result).toEqual({ commitDate: '2022-07-01T00:01:02-04:00', commitHash: 'abcbeef' });
    });
  });

  xdescribe('with existing tag', () => {
    beforeEach(() => {
      (describeRefSync as jest.Mock).mockReturnValue(tagStub);
    });

    it('should return first commit date and hash when last tag is not found', async () => {
      const execSpy = (execSync as jest.Mock)
        .mockReturnValueOnce('')
        .mockReturnValueOnce('"deedbeaf 2022-07-01T00:01:02-04:00"');

      const result = await getOldestCommitSinceLastTag(execOpts);

      expect(execSpy).toHaveBeenCalledWith('git', ['log', 'v1.0.0..HEAD', '--format="%h %aI"', '--reverse'], execOpts);
      expect(execSpy).toHaveBeenCalledWith('git', ['log', '-1', '--format="%h %aI"', 'v1.0.0'], execOpts);
      expect(result).toEqual({ commitDate: '2022-07-01T00:01:02-04:00', commitHash: 'deedbeaf' });
    });

    it('should expect a result with a tag date, hash and ref count when last tag is found', async () => {
      const result = await getOldestCommitSinceLastTag(execOpts, false, false);
      const execSpy = (execSync as jest.Mock).mockReturnValueOnce('"deadbeef 2022-07-01T00:01:02-04:00"');

      expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test' }, false);
      expect(execSpy).toHaveBeenCalledWith('git', ['log', 'v1.0.0..HEAD', '--format="%h %aI"', '--reverse'], execOpts);
      expect(result).toEqual({ commitDate: '2022-07-01T00:01:02-04:00', commitHash: 'deadbeef' });
    });
  });

  describe('with existing tag in independent mode', () => {
    beforeEach(() => {
      (describeRefSync as jest.Mock).mockReturnValue({
        ...tagStub,
        lastTagName: '@my-workspace/pkg-a@2.0.3',
        lastVersion: '2.0.3',
      });
    });

    it('should expect a tag date & hash but queried with a particular tag match pattern when using independent mode', async () => {
      const isIndependent = true;
      const mockExecSyncResult = '"deadabcd 2022-07-01T00:01:02-06:00"';
      (execSync as jest.Mock).mockReturnValue(mockExecSyncResult);
      const result = await getOldestCommitSinceLastTag(execOpts, isIndependent, false);
      const execSpy = (execSync as jest.Mock).mockReturnValueOnce(mockExecSyncResult);

      expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*@*' }, false);
      expect(execSpy).toHaveBeenCalledWith(
        'git',
        ['log', '@my-workspace/pkg-a@2.0.3..HEAD', '--format="%h %aI"', '--reverse'],
        execOpts
      );
      expect(result).toEqual({ commitDate: '2022-07-01T00:01:02-06:00', commitHash: 'deadabcd' });
    });

    it('should expect a commit date and hash when using different time zone', async () => {
      const isIndependent = true;
      const result = await getOldestCommitSinceLastTag(execOpts, isIndependent, false);
      const execSpy = (execSync as jest.Mock)
        .mockReturnValueOnce('')
        .mockReturnValueOnce('"deadbeef 2022-07-01T00:01:02+01:00"');

      expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*@*' }, false);
      expect(execSpy).toHaveBeenCalledWith(
        'git',
        ['log', '@my-workspace/pkg-a@2.0.3..HEAD', '--format="%h %aI"', '--reverse'],
        execOpts
      );
      expect(result).toEqual({ commitDate: '2022-07-01T00:01:02+01:00', commitHash: 'deadbeef' });
    });
  });
});
