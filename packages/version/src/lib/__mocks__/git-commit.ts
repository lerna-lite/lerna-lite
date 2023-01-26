// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
export const gitCommit = jest.fn(() => Promise.resolve());
