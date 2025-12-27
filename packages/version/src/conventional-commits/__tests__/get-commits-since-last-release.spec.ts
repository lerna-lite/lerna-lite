import { describeRefSync, execSync, ValidationError } from '@lerna-lite/core';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { getCommitsSinceLastRelease, getOldestCommitSinceLastTag } from '../get-commits-since-last-release.js';
import { getGithubCommits } from '../get-github-commits.js';

vi.mock('@lerna-lite/core');
vi.mock('../get-github-commits');

const { execSyncMock, describeRefSyncMock } = vi.hoisted(() => ({ execSyncMock: vi.fn(), describeRefSyncMock: vi.fn() }));
vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')), // return the other real methods, below we'll mock only 2 of the methods
  execSync: execSyncMock,
  describeRefSync: describeRefSyncMock,
}));

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
    (describeRefSync as Mock).mockReturnValue(tagStub);
  });

  it('throws an error with correct message if used with a remote client other than "github"', async () => {
    // Mocking any necessary dependencies
    (execSync as Mock).mockReturnValue('"deadbeef 2022-07-01T00:01:02-04:00"');

    await expect(getCommitsSinceLastRelease('gitlab', 'durable', 'main', false, execOpts)).rejects.toThrow(/.*/);
  });

  it('throws a ValidationError for null or undefined client', async () => {
    await expect(getCommitsSinceLastRelease(null as any, 'durable', 'main', false, execOpts)).rejects.toThrow(ValidationError);
    await expect(getCommitsSinceLastRelease(undefined as any, 'durable', 'main', false, execOpts)).rejects.toThrow(
      ValidationError
    );
  });

  it('throws a ValidationError for case-insensitive non-github clients', async () => {
    await expect(getCommitsSinceLastRelease('GITHUB' as any, 'durable', 'main', false, execOpts)).rejects.toThrow(
      ValidationError
    );
    await expect(getCommitsSinceLastRelease('GiTlAb' as any, 'durable', 'main', false, execOpts)).rejects.toThrow(
      ValidationError
    );
  });

  it('should expect commits returned when using "github" when a valid tag is returned', async () => {
    (getGithubCommits as Mock).mockResolvedValue(commitsStub);
    (execSync as Mock).mockReturnValue('"deadbeef 2022-07-01T00:01:02-04:00"');
    const isIndependent = false;
    const result = await getCommitsSinceLastRelease('github', 'durable', 'main', isIndependent, execOpts);

    expect(result).toEqual(commitsStub);
  });

  it('should expect commits returned when using "github" when a valid tag in independent mode is returned', async () => {
    (getGithubCommits as Mock).mockResolvedValue(commitsStub);
    (execSync as Mock).mockReturnValueOnce('"abcbeef 2022-07-01T00:01:02-04:00"');
    const isIndependent = true;
    const result = await getCommitsSinceLastRelease('github', 'durable', 'main', isIndependent, execOpts);

    expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*@*' }, false);
    expect(result).toEqual(commitsStub);
  });
});

describe('getOldestCommitSinceLastTag', () => {
  describe('without tag', () => {
    beforeEach(() => {
      (describeRefSync as Mock).mockReturnValue({
        lastTagName: undefined,
        lastVersion: undefined,
        refCount: '1',
        sha: 'deadbeef',
        isDirty: false,
      });
    });

    it('should return first commit date format as ISO+offset when describeRefSync() did not return a tag date', () => {
      const execSpy = (execSync as Mock).mockReturnValueOnce('"abcbeef 2022-07-01T00:01:02-04:00"');
      const result = getOldestCommitSinceLastTag(execOpts);

      expect(execSpy).toHaveBeenCalledWith(
        'git',
        ['log', '--oneline', '--format="%h %aI"', '--reverse', '--max-parents=0', 'HEAD'],
        execOpts
      );
      expect(result).toEqual({
        commitDate: '2022-07-01T00:01:02-04:00',
        commitHash: 'abcbeef',
      });
    });

    it('should return first commit date with a TZ format when describeRefSync() did not return a tag date', () => {
      const execSpy = (execSync as Mock).mockReturnValueOnce('"abcbeef 2024-05-16T10:37:42Z"');
      const result = getOldestCommitSinceLastTag(execOpts);

      expect(execSpy).toHaveBeenCalledWith(
        'git',
        ['log', '--oneline', '--format="%h %aI"', '--reverse', '--max-parents=0', 'HEAD'],
        execOpts
      );
      expect(result).toEqual({ commitDate: '2024-05-16T10:37:42Z', commitHash: 'abcbeef' });
    });

    it('should return first commit date with a TZ and microsecond format when describeRefSync() did not return a tag date', () => {
      const execSpy = (execSync as Mock).mockReturnValueOnce('"abcbeef 2024-05-16T10:37:42.234Z"');
      const result = getOldestCommitSinceLastTag(execOpts);

      expect(execSpy).toHaveBeenCalledWith(
        'git',
        ['log', '--oneline', '--format="%h %aI"', '--reverse', '--max-parents=0', 'HEAD'],
        execOpts
      );
      expect(result).toEqual({
        commitDate: '2024-05-16T10:37:42.234Z',
        commitHash: 'abcbeef',
      });
    });
  });

  describe('with existing tag in independent mode', () => {
    beforeEach(() => {
      (describeRefSync as Mock).mockReturnValue({
        ...tagStub,
        lastTagName: '@my-workspace/pkg-a@2.0.3',
        lastVersion: '2.0.3',
      });
    });

    afterEach(() => {
      (execSync as Mock).mockReset();
    });

    it('should expect a tag date & hash but queried with a particular tag match pattern when using independent mode', () => {
      const isIndependent = true;
      const mockExecSyncResult = '"deadabcd 2022-07-01T00:01:02-06:00"';
      (execSync as Mock).mockReturnValueOnce(mockExecSyncResult);
      const result = getOldestCommitSinceLastTag(execOpts, isIndependent, false);
      const execSpy = (execSync as Mock).mockReturnValueOnce(mockExecSyncResult);

      expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*@*' }, false);
      expect(execSpy).toHaveBeenCalledWith(
        'git',
        ['log', '@my-workspace/pkg-a@2.0.3..HEAD', '--format="%h %aI"', '--reverse'],
        execOpts
      );
      expect(result).toEqual({
        commitDate: '2022-07-01T00:01:02-06:00',
        commitHash: 'deadabcd',
      });
    });

    it('should expect a commit date and hash when using different time zone', () => {
      const isIndependent = true;
      (execSync as Mock).mockReturnValueOnce('"deadbeef 2022-07-01T00:01:02+01:00"');
      const result = getOldestCommitSinceLastTag(execOpts, isIndependent, false);
      const execSpy = (execSync as Mock).mockReturnValueOnce('"deadbeef 2022-07-01T00:01:02+01:00"');

      expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test', match: '*@*' }, false);
      expect(execSpy).toHaveBeenCalledWith(
        'git',
        ['log', '@my-workspace/pkg-a@2.0.3..HEAD', '--format="%h %aI"', '--reverse'],
        execOpts
      );
      expect(result).toEqual({
        commitDate: '2022-07-01T00:01:02+01:00',
        commitHash: 'deadbeef',
      });
    });
  });

  describe('with existing tag', () => {
    beforeEach(() => {
      (describeRefSync as Mock).mockReturnValue(tagStub);
    });

    it('should return first commit date and hash when last tag is not found', () => {
      const execSpy = (execSync as Mock).mockReturnValueOnce('').mockReturnValueOnce('"deedbeaf 2022-07-01T00:01:02-04:00"');

      const result = getOldestCommitSinceLastTag(execOpts);

      expect(execSpy).toHaveBeenCalledWith('git', ['log', 'v1.0.0..HEAD', '--format="%h %aI"', '--reverse'], execOpts);
      expect(execSpy).toHaveBeenCalledWith('git', ['log', '-1', '--format="%h %aI"', 'v1.0.0'], execOpts);
      expect(result).toEqual({ commitDate: '2022-07-01T00:01:02-04:00', commitHash: 'deedbeaf' });
    });

    it('should expect a result with a tag date, hash and ref count when last tag is found', () => {
      const execSpy = (execSync as Mock).mockReturnValueOnce('"deadbeef 2022-07-01T00:01:02-04:00"');
      const result = getOldestCommitSinceLastTag(execOpts, false, false);

      expect(describeRefSync).toHaveBeenCalledWith({ cwd: '/test' }, false);
      expect(execSpy).toHaveBeenCalledWith('git', ['log', 'v1.0.0..HEAD', '--format="%h %aI"', '--reverse'], execOpts);
      expect(result).toEqual({ commitDate: '2022-07-01T00:01:02-04:00', commitHash: 'deadbeef' });
    });
  });
});