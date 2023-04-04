// to mock user modules, you _must_ call `vi.mock('./path/to/module')`
export const verifyNpmPackageAccess = vi.fn(() => Promise.resolve());
