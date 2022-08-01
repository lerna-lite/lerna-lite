// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
export const getNpmUsername = jest.fn(() => Promise.resolve('lerna-test'));
