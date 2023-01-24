import execa from 'execa';
import os from 'os';
import { tempWrite } from '../../packages/version/src/utils/temp-write';
import path from 'path';
import cp from 'child_process';
import loadJsonFile from 'load-json-file';
import writeJsonFile from 'write-json-file';
import gitSHA from '../serializers/serialize-git-sha';

// Contains all relevant git config (user, commit.gpgSign, etc)
const TEMPLATE = path.resolve(__dirname, 'template');

export function getCommitMessage(cwd, format = '%B') {
  return execa('git', ['log', '-1', `--pretty=format:${format}`], { cwd }).then((result) => result.stdout);
}

export function gitAdd(cwd, ...files) {
  return execa('git', ['add', ...files], { cwd });
}

export function gitCheckout(cwd, args) {
  return execa('git', ['checkout', ...args], { cwd });
}

export function gitCommit(cwd, message) {
  if (message.indexOf(os.EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    return tempWrite(message).then((fp) => execa('git', ['commit', '-F', fp], { cwd }));
  }

  return execa('git', ['commit', '-m', message], { cwd });
}

export function gitInit(cwd, ...args) {
  return execa('git', ['init', '--template', TEMPLATE, ...args], { cwd }).then(() =>
    execa('git', ['checkout', '-B', 'main'], { cwd })
  );
}

export function gitMerge(cwd, args) {
  return execa('git', ['merge', ...args], { cwd });
}

export function gitStatus(cwd) {
  return cp.spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
}

export function gitTag(cwd, tagName) {
  return execa('git', ['tag', tagName, '-m', tagName], { cwd });
}

export function showCommit(cwd, ...args) {
  return execa(
    'git',
    [
      'show',
      '--unified=0',
      '--ignore-space-at-eol',
      '--pretty=%B%+D',
      // make absolutely certain that no OS localization
      // changes the expected value of the path prefixes
      '--src-prefix=a/',
      '--dst-prefix=b/',
      ...args,
    ],
    { cwd }
  ).then((result) => gitSHA.serialize(result.stdout));
}

export function commitChangeToPackage(cwd, packageName, commitMsg, data) {
  const packageJSONPath = path.join(cwd, 'packages', packageName, 'package.json');

  // QQ no async/await yet...
  let chain: Promise<any> = Promise.resolve();

  chain = chain.then(() => loadJsonFile(packageJSONPath));
  chain = chain.then((pkg) => writeJsonFile(packageJSONPath, Object.assign(pkg, data)));
  chain = chain.then(() => gitAdd(cwd, packageJSONPath));
  chain = chain.then(() => gitCommit(cwd, commitMsg));

  return chain;
}
