// to mock user modules, you _must_ call `jest.mock('./path/to/module')`
export const getTwoFactorAuthRequired = jest.fn(() => Promise.resolve(false));
