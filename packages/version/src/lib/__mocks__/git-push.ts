// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
export const gitPush = jest.fn(() => Promise.resolve());
