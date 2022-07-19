jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
}));

// mocked modules
import { logOutput } from '@lerna-lite/core';

import { lerna } from '../lerna-entry';

describe('cli lerna-entry', () => {
  it('should execute lerna info', async () => {
    const output = await lerna(['info']);

    expect(output).toBeTruthy();
    expect((logOutput as any).logged()).toContain('Environment info:');
  });
});
