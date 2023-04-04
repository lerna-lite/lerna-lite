// to mock user modules, you _must_ call `vi.mock('./path/to/module')`
export const gitAdd = vi.fn(() => Promise.resolve());
