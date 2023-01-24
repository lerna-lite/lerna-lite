export const getCommitsSinceLastRelease = jest.fn(() => Promise.resolve());
export const getLastTagDetails = jest.fn(() => ({ tagHash: undefined, tagDate: undefined, tagRefCount: 0 }));
