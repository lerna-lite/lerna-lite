import chalk from 'chalk';
import npmlog from 'npmlog';

import { exec, execSync } from '../child-process';

/**
 * @typedef {object} UncommittedConfig
 * @property {string} cwd
 * @property {typeof npmlog} [log]
 */

const maybeColorize = (colorize) => (s) => (s !== ' ' ? colorize(s) : s);
const cRed = maybeColorize(chalk.red);
const cGreen = maybeColorize(chalk.green);

const replaceStatus = (_, maybeGreen, maybeRed) => `${cGreen(maybeGreen)}${cRed(maybeRed)}`;

const colorizeStats = (stats) =>
  stats.replace(/^([^U]| )([A-Z]| )/gm, replaceStatus).replace(/^\?{2}|U{2}/gm, cRed('$&'));

const splitOnNewLine = (str) => str.split('\n');

const filterEmpty = (lines) => lines.filter((line) => line.length);

const o = (l, r) => (x) => l(r(x));

const transformOutput = o(filterEmpty, o(splitOnNewLine, colorizeStats));

/**
 * Report uncommitted files. (async)
 * @param {UncommittedConfig} options
 * @returns {Promise<string[]>} A list of uncommitted files
 */
export function collectUncommitted({ cwd, log = npmlog }, gitDryRun = false) {
  log.silly('collect-uncommitted', 'git status --porcelain (async)');

  return exec('git', ['status', '--porcelain'], { cwd }, gitDryRun)
    .then(({ stdout }) => transformOutput(stdout));
}

/**
 * Report uncommitted files. (sync)
 * @param {UncommittedConfig} options
 * @returns {string[]} A list of uncommitted files
 */
export function collectUncommittedSync({ cwd, log = npmlog }: { cwd: string; log?: typeof npmlog }, gitDryRun = false) {
  log.silly('collect-uncommitted', 'git status --porcelain (sync)');

  const stdout = execSync('git', ['status', '--porcelain'], { cwd }, gitDryRun);
  return transformOutput(stdout);
}
