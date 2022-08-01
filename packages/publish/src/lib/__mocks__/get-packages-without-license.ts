// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
export const getPackagesWithoutLicense = jest.fn(() => Promise.resolve([]));
