import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { up } from 'empathic/find';
import { execa } from 'execa';
import { copy, ensureDir } from 'fs-extra/esm';
import { gitAdd, gitCommit, gitInit } from './git/index.js';
import { temporaryDirectory } from './index.js';

export function cloneFixtureFactory(startDir: string) {
  const initFixture = initFixtureFactory(startDir);

  return (...args: any[]) =>
    // @ts-ignore
    initFixture(...args).then((cwd) => {
      const repoDir = temporaryDirectory();
      const repoUrl = pathToFileURL(repoDir).toString();

      return execa('git', ['init', '--bare'], { cwd: repoDir })
        .then(() => execa('git', ['checkout', '-B', 'main'], { cwd }))
        .then(() => execa('git', ['remote', 'add', 'origin', repoUrl], { cwd }))
        .then(() => execa('git', ['push', '-u', 'origin', 'main'], { cwd }))
        .then(() => ({
          cwd,
          repository: repoUrl,
        }));
    });
}

export function findFixture(cwd: string, fixtureName: string) {
  return Promise.resolve(up(join('__fixtures__', fixtureName), { cwd })).then((fixturePath) => {
    if (fixturePath === undefined) {
      throw new Error(`Could not find fixture with name "${fixtureName}"`);
    }

    return fixturePath;
  });
}

export function copyFixture(targetDir: string, fixtureName: string, cwd: string) {
  return findFixture(cwd, fixtureName).then((fp) => copy(fp, targetDir));
}

export function initFixtureFactory(startDir: string) {
  return (fixtureName: string, commitMessage: boolean | string = 'Init commit') => {
    const cwd = temporaryDirectory();
    let chain: Promise<any> = Promise.resolve();

    chain = chain.then(() => process.chdir(cwd));
    chain = chain.then(() => copyFixture(cwd, fixtureName, startDir));
    chain = chain.then(() => gitInit(cwd, '.'));

    if (commitMessage) {
      chain = chain.then(() => gitAdd(cwd, '-A'));
      chain = chain.then(() => gitCommit(cwd, commitMessage));
    }

    return chain.then(() => cwd);
  };
}

export function initNamedFixtureFactory(startDir: string) {
  return (dirName: string, fixtureName: string, commitMessage: boolean | string = 'Init commit') => {
    const cwd = join(temporaryDirectory(), dirName);
    let chain: Promise<any> = Promise.resolve();

    chain = chain.then(() => ensureDir(cwd));
    chain = chain.then(() => process.chdir(cwd));
    chain = chain.then(() => copyFixture(cwd, fixtureName, startDir));
    chain = chain.then(() => gitInit(cwd, '.'));

    if (commitMessage) {
      chain = chain.then(() => gitAdd(cwd, '-A'));
      chain = chain.then(() => gitCommit(cwd, commitMessage));
    }

    return chain.then(() => cwd);
  };
}
