jest.mock('../describe-ref');
jest.mock('../collect-uncommitted');

const { describeRef } = require('../describe-ref');
const { collectUncommitted } = require('../collect-uncommitted');
const { checkWorkingTree } = require('../check-working-tree');

describe('check-working-tree', () => {
  it('resolves on a clean tree with no release tags', async () => {
    describeRef.mockResolvedValueOnce({ refCount: '1' });

    const result = await checkWorkingTree({ cwd: 'foo' });

    expect(result).toEqual({ refCount: '1' });
    expect(describeRef).toHaveBeenLastCalledWith({ cwd: 'foo' }, undefined, false);
  });

  it('rejects when current commit has already been released', async () => {
    describeRef.mockResolvedValueOnce({ refCount: '0' });

    await expect(checkWorkingTree()).rejects.toThrow('The current commit has already been released');
  });

  it('rejects when working tree has uncommitted changes', async () => {
    describeRef.mockResolvedValueOnce({ isDirty: true });
    collectUncommitted.mockResolvedValueOnce(['AD file']);

    await expect(checkWorkingTree()).rejects.toThrow('\nAD file');
  });

  it('passes cwd to collectUncommitted when working tree has uncommitted changes', async () => {
    describeRef.mockResolvedValueOnce({ isDirty: true });
    collectUncommitted.mockResolvedValueOnce(['MM file']);

    await expect(checkWorkingTree({ cwd: 'foo' })).rejects.toThrow('Working tree has uncommitted changes');

    expect(collectUncommitted).toHaveBeenLastCalledWith({ cwd: 'foo' }, false);
  });
});
