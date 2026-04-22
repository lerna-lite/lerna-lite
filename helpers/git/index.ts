import cp from 'node:child_process';
import { EOL } from 'node:os';
import { join, resolve as pathResolve } from 'node:path';

import { loadJsonFile } from 'load-json-file';
import { x } from 'tinyexec';
import { writeJsonFile } from 'write-json-file';

import { tempWrite } from '../../packages/version/dist/utils/temp-write.js';
import gitSHA from '../serializers/serialize-git-sha.js';

const TEMPLATE = pathResolve(import.meta.dirname, 'template');

/** Replicates Execa's stripFinalNewline: true behavior. */
const strip = (str: string) => str.replace(/\r?\n$/, '');

export function getCommitMessage(cwd: string, format = '%B') {
  return x('git', ['log', '-1', `--pretty=format:${format}`], { nodeOptions: { cwd } }).then((result) => strip(result.stdout));
}

export function gitAdd(cwd: string, ...files: string[]) {
  return x('git', ['add', ...files], { nodeOptions: { cwd } });
}

export function gitCheckout(cwd: string, args: any[]) {
  return x('git', ['checkout', ...args], { nodeOptions: { cwd } });
}

export function gitCommit(cwd: string, message: string) {
  if (message.indexOf(EOL) > -1) {
    return tempWrite(message).then((fp) => x('git', ['commit', '-F', fp], { nodeOptions: { cwd } }));
  }

  return x('git', ['commit', '-m', message], { nodeOptions: { cwd } });
}

export function gitInit(cwd: string, ...args: any[]) {
  return x('git', ['init', '--template', TEMPLATE, ...args], { nodeOptions: { cwd } }).then(() =>
    x('git', ['checkout', '-B', 'main'], { nodeOptions: { cwd } })
  );
}

export function gitMerge(cwd: string, args: any[]) {
  return x('git', ['merge', ...args], { nodeOptions: { cwd } });
}

export function gitStatus(cwd: string) {
  // Keeping spawnSync for now as it returns a structured result that porcelain expects
  return cp.spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
}

export function gitTag(cwd: string, tagName: string) {
  return x('git', ['tag', tagName, '-m', tagName], { nodeOptions: { cwd } });
}

export function showCommit(cwd: string, ...args: any[]) {
  return x(
    'git',
    ['show', '--unified=0', '--ignore-space-at-eol', '--pretty=%B%+D', '--src-prefix=a/', '--dst-prefix=b/', ...args],
    { nodeOptions: { cwd } }
  ).then((result) => gitSHA.serialize(strip(result.stdout)));
}

export async function commitChangeToPackage(cwd: string, packageName: string, commitMsg: string, data: any) {
  const packageJSONPath = join(cwd, 'packages', packageName, 'package.json');
  const pkg = await loadJsonFile(packageJSONPath);
  await writeJsonFile(packageJSONPath, Object.assign({}, pkg, data));
  await gitAdd(cwd, packageJSONPath);
  return await gitCommit(cwd, commitMsg);
}
