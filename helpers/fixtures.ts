'use strict';

import execa from 'execa';
import fileUrl from 'file-url';
import tempy from 'tempy';
import fs from 'fs-extra';
import findUp from 'find-up';
import path from 'path';
const { gitAdd, gitCommit, gitInit } = require('./git');

export function cloneFixtureFactory(startDir: string) {
  const initFixture = initFixtureFactory(startDir);

  return (...args: any[]) =>
    // @ts-ignore
    initFixture(...args).then((cwd) => {
      const repoDir = tempy.directory();
      const repoUrl = fileUrl(repoDir, { resolve: false });

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
  return findUp(path.join('__fixtures__', fixtureName), { cwd, type: 'directory' }).then((fixturePath) => {
    if (fixturePath === undefined) {
      throw new Error(`Could not find fixture with name "${fixtureName}"`);
    }

    return fixturePath;
  });
}

export function copyFixture(targetDir: string, fixtureName: string, cwd: string) {
  return findFixture(cwd, fixtureName).then((fp) => fs.copy(fp, targetDir));
}

export function initFixtureFactory(startDir: string) {
  return (fixtureName: string, commitMessage: boolean | string = 'Init commit') => {
    const cwd = tempy.directory();
    let chain = Promise.resolve();

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
    const cwd = path.join(tempy.directory(), dirName);
    let chain = Promise.resolve();

    chain = chain.then(() => fs.ensureDir(cwd));
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
