import { Mock, vi } from 'vitest';
import chalk from 'chalk';
import { multiLineTrimRight } from '@lerna-test/helpers';

// keep snapshots stable cross-platform
chalk.level = 0;

// @lerna/output is just a wrapper around console.log
const mockOutput = vi.fn();

export function logged() {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(args[0])).join('\n');
}

export const logOutput = mockOutput as Mock<any, any> & { logged: () => string };
logOutput.logged = logged;
