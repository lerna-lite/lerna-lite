import { describe, expect, it, vi } from 'vitest';
import { lerna } from '../lerna-entry.js';

vi.mock('../cli-commands/cli-changed-commands');
vi.mock('../cli-commands/cli-diff-commands');
vi.mock('../cli-commands/cli-exec-commands');
vi.mock('../cli-commands/cli-init-commands');
vi.mock('../cli-commands/cli-list-commands');
vi.mock('../cli-commands/cli-publish-commands');
vi.mock('../cli-commands/cli-run-commands');
vi.mock('../cli-commands/cli-version-commands');
vi.mock('../cli-commands/cli-watch-commands');

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
}));

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
