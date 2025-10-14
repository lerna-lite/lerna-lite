import { type Mock, vi } from 'vitest';
import { multiLineTrimRight, stripAnsi } from '@lerna-test/helpers';

// @lerna/output is just a wrapper around console.log
const mockOutput = vi.fn();

export function logged(strip = true) {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(stripAnsi(args[0], strip))).join('\n');
}

export const logOutput = mockOutput as Mock<any> & { logged: () => string };
logOutput.logged = logged;
