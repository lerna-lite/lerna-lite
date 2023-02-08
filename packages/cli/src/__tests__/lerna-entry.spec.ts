jest.mock('../cli-commands/cli-changed-commands');
jest.mock('../cli-commands/cli-diff-commands');
jest.mock('../cli-commands/cli-exec-commands');
jest.mock('../cli-commands/cli-init-commands');
jest.mock('../cli-commands/cli-list-commands');
jest.mock('../cli-commands/cli-publish-commands');
jest.mock('../cli-commands/cli-run-commands');
jest.mock('../cli-commands/cli-version-commands');
jest.mock('../cli-commands/cli-watch-commands');

jest.mock('@lerna-lite/core', () => ({
  ...(jest.requireActual('@lerna-lite/core') as any), // return the other real methods, below we'll mock only 2 of the methods
  logOutput: jest.requireActual('../../../core/src/__mocks__/output').logOutput,
}));

import { lerna } from '../lerna-entry';

describe('cli lerna-entry', () => {
  it('should execute lerna changed', async () => {
    const output = await lerna(['changed']);
    expect(output).toBeTruthy();
  });

  it('should execute lerna diff', async () => {
    const output = await lerna(['diff']);
    expect(output).toBeTruthy();
  });

  it('should execute lerna exec', async () => {
    const output = await lerna(['exec']);
    expect(output).toBeTruthy();
  });

  it('should execute lerna init', async () => {
    const output = await lerna(['init']);
    expect(output).toBeTruthy();
  });
});
