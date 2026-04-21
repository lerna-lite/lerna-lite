import cp from 'node:child_process';
import { EOL } from 'node:os';
import { join, resolve as pathResolve } from 'node:path';

import { loadJsonFile } from 'load-json-file';
import { x } from 'tinyexec';
import { writeJsonFile } from 'write-json-file';

import { tempWrite } from '../../packages/version/dist/utils/temp-write.js';
import gitSHA from '../serializers/serialize-git-sha.js';

const TEMPLATE = pathResolve(import.meta.dirname, 'template');

/**
 * Replicates Execa's stripFinalNewline: true behavior.
 */
const strip = (str: string) => str.replace(/\r?\n$/, '');

export function getCommitMessage(cwd, format = '%B') {
  return x('git', ['log', '-1', `--pretty=format:${format}`], { nodeOptions: { cwd } }).then((result) => strip(result.stdout));
}

export function gitAdd(cwd, ...files) {
  return x('git', ['add', ...files], { nodeOptions: { cwd } });
}

export function gitCheckout(cwd, args) {
  return x('git', ['checkout', ...args], { nodeOptions: { cwd } });
}

export function gitCommit(cwd, message) {
  if (message.indexOf(EOL) > -1) {
    return tempWrite(message).then((fp) => x('git', ['commit', '-F', fp], { nodeOptions: { cwd } }));
  }

  return x('git', ['commit', '-m', message], { nodeOptions: { cwd } });
}

export function gitInit(cwd, ...args) {
  return x('git', ['init', '--template', TEMPLATE, ...args], { nodeOptions: { cwd } }).then(() =>
    x('git', ['checkout', '-B', 'main'], { nodeOptions: { cwd } })
  );
}

export function gitMerge(cwd, args) {
  return x('git', ['merge', ...args], { nodeOptions: { cwd } });
}

export function gitStatus(cwd) {
  // Keeping spawnSync for now as it returns a structured result that porcelain expects
  return cp.spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
}

export function gitTag(cwd, tagName) {
  return x('git', ['tag', tagName, '-m', tagName], { nodeOptions: { cwd } });
}

export function showCommit(cwd, ...args) {
  return x(
    'git',
    ['show', '--unified=0', '--ignore-space-at-eol', '--pretty=%B%+D', '--src-prefix=a/', '--dst-prefix=b/', ...args],
    { nodeOptions: { cwd } }
  ).then((result) => gitSHA.serialize(strip(result.stdout)));
}

export function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = join(cwd, 'packages', packageName, 'package.json');
  let chain: Promise<any> = Promise.resolve();

  chain = chain.then(() => loadJsonFile(packageJSONPath));
  chain = chain.then((pkg) => writeJsonFile(packageJSONPath, Object.assign(pkg, data)));
  chain = chain.then(() => gitAdd(cwd, packageJSONPath));
  chain = chain.then(() => gitCommit(cwd, commitMsg));

  return chain;
}
