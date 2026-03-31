// https://github.com/conventional-changelog/conventional-changelog/blob/b516084ef6a725197f148236c0ddbfae7ffe3e6f/packages/conventional-changelog-angular/conventional-recommended-bump.js
// (conventional-changelog-angular/conventional-recommended-bump.js, etc)
import parserOpts from './parser-opts.js';
import whatBump from './what-bump.js';
import writerOpts from './writer-opts.js';

export default {
  parser: parserOpts,
  writer: writerOpts,
  whatBump,
};
