// to mock user modules, you _must_ call `vi.mock('./path/to/module')`
export const getNpmUsername = vi.fn(() => Promise.resolve('lerna-test'));
