import chalk from 'chalk';
import { multiLineTrimRight } from '@lerna-test/helpers';

// keep snapshots stable cross-platform
chalk.level = 0;

// @lerna/output is just a wrapper around console.log
const mockOutput = jest.fn();

export function logged() {
  return mockOutput.mock.calls.map((args) => multiLineTrimRight(args[0])).join('\n');
}

module.exports.logOutput = mockOutput;
module.exports.logOutput.logged = logged;
