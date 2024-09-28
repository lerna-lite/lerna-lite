import { Mock, vi } from 'vitest';
import { multiLineTrimRight } from '@lerna-test/helpers';

// @lerna/output is just a wrapper around console.log
const mockOutput = vi.fn();

export function logged() {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(args[0])).join('\n');
}

export const logOutput = mockOutput as Mock<any> & { logged: () => string };
logOutput.logged = logged;
