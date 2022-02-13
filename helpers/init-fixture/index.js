const tempy = require('tempy');
const { copyFixture } = require('../copy-fixture');
const { gitAdd } = require('../git-add');
const { gitCommit } = require('../git-commit');
const { gitInit } = require('../git-init');

module.exports = initFixture;

function initFixture(startDir) {
  return (fixtureName, commitMessage = 'Init commit') => {
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
