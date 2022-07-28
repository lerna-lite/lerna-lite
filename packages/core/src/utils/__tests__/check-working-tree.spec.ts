jest.mock('../describe-ref');
jest.mock('../collect-uncommitted');

import { describeRef } from '../describe-ref';
import { collectUncommitted } from '../collect-uncommitted';
import { checkWorkingTree } from '../check-working-tree';

describe('check-working-tree', () => {
  it('resolves on a clean tree with no release tags', async () => {
    (describeRef as jest.Mock).mockResolvedValueOnce({ refCount: '1' });

    const result = await checkWorkingTree({ cwd: 'foo' });

    expect(result).toEqual({ refCount: '1' });
    expect(describeRef).toHaveBeenLastCalledWith({ cwd: 'foo' }, undefined, false);
  });

  it('rejects when current commit has already been released', async () => {
    (describeRef as jest.Mock).mockResolvedValueOnce({ refCount: '0' });

    await expect(checkWorkingTree()).rejects.toThrow('The current commit has already been released');
  });

  it('rejects when working tree has uncommitted changes', async () => {
    (describeRef as jest.Mock).mockResolvedValueOnce({ isDirty: true });
    (collectUncommitted as jest.Mock).mockResolvedValueOnce(['AD file']);

    await expect(checkWorkingTree()).rejects.toThrow('\nAD file');
  });

  it('passes cwd to collectUncommitted when working tree has uncommitted changes', async () => {
    (describeRef as jest.Mock).mockResolvedValueOnce({ isDirty: true });
    (collectUncommitted as jest.Mock).mockResolvedValueOnce(['MM file']);

    await expect(checkWorkingTree({ cwd: 'foo' })).rejects.toThrow('Working tree has uncommitted changes');

    expect(collectUncommitted).toHaveBeenLastCalledWith({ cwd: 'foo' }, false);
  });
});
