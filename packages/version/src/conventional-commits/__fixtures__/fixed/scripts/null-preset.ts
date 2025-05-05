// https://github.com/conventional-changelog/conventional-changelog/blob/b516084ef6a725197f148236c0ddbfae7ffe3e6f/packages/conventional-changelog-angular/conventional-recommended-bump.js
// (conventional-changelog-angular/conventional-recommended-bump.js, etc)
import whatBump from './null-what-bump.js';
import parserOpts from './parser-opts.js';
import writerOpts from './writer-opts.js';

export const output = {
  conventionalChangelog: {
    parserOpts,
    writerOpts,
  },
  recommendedBumpOpts: {
    parserOpts,
    whatBump,
  },
};
