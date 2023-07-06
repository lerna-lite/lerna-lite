import chalk from 'chalk';
import npmlog from 'npmlog';

import { exec, execSync } from '../child-process.js';

export interface UncommittedConfig {
  cwd: string;
  log?: typeof npmlog;
}

const maybeColorize = (colorize: (color?: string) => string) => (s?: string) => (s !== ' ' ? colorize(s) : s);
const cRed = maybeColorize(chalk.red);
const cGreen = maybeColorize(chalk.green);
const replaceStatus = (_, maybeGreen?: string, maybeRed?: string) => `${cGreen(maybeGreen)}${cRed(maybeRed)}`;
const colorizeStats = (stats: string) =>
  stats.replace(/^([^U]| )([A-Z]| )/gm, replaceStatus).replace(/^\?{2}|U{2}/gm, cRed('$&'));
const splitOnNewLine = (str: string) => str.split('\n');
const filterEmpty = (lines: string[]) => lines.filter((line) => line.length);
const o = (l: any, r: any) => (x) => l(r(x));
const transformOutput = o(filterEmpty, o(splitOnNewLine, colorizeStats));

/**
 * Report uncommitted files. (async)
 * @param {UncommittedConfig} options
 * @returns {Promise<string[]>} A list of uncommitted files
 */
export function collectUncommitted({ cwd, log = npmlog }: UncommittedConfig, dryRun = false): Promise<string[]> {
  log.silly('collect-uncommitted', 'git status --porcelain (async)');

  return exec('git', ['status', '--porcelain'], { cwd }, dryRun).then(({ stdout }) => transformOutput(stdout));
}

/**
 * Report uncommitted files. (sync)
 * @param {UncommittedConfig} options
 * @returns {string[]} A list of uncommitted files
 */
export function collectUncommittedSync({ cwd, log = npmlog }: UncommittedConfig, dryRun = false): string[] {
  log.silly('collect-uncommitted', 'git status --porcelain (sync)');

  const stdout = execSync('git', ['status', '--porcelain'], { cwd }, dryRun);
  return transformOutput(stdout);
}
