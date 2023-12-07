import normalizeNewline from 'normalize-newline';

import gitSHA from './serialize-git-sha.js';

const serializeChangelog = {
  serialize(str) {
    return gitSHA
      .serialize(normalizeNewline(str))
      .replace(/(\[.*?\])\(.*\/compare\/(.*?)\)/g, '$1(/compare/$2)')
      .replace(/(\[.*?\])\(.*\/commits\/GIT_HEAD\)/g, '$1(COMMIT_URL)')
      .replace(/\(\d{4}-\d{1,2}-\d{1,2}\)/g, '(YYYY-MM-DD)');
  },
  test(val) {
    return val != null && typeof val === 'string';
  },
};

export default serializeChangelog;
