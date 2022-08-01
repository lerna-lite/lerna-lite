// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
export const verifyNpmPackageAccess = jest.fn(() => Promise.resolve());
