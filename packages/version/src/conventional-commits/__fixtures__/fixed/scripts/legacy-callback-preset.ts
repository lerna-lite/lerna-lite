// https://github.com/conventional-changelog/conventional-changelog/blob/b516084ef6a725197f148236c0ddbfae7ffe3e6f/packages/conventional-changelog-angular/conventional-recommended-bump.js
// (conventional-changelog-angular/conventional-recommended-bump.js, etc)
import parserOpts from './parser-opts.js';
import whatBump from './what-bump.js';
import writerOpts from './writer-opts.js';

// https://github.com/conventional-changelog/conventional-changelog/blob/943542f3b2342bb5933d84847fb19b727c607df0/packages/conventional-changelog-ember/index.js#L10

export default function presetOpts(cb) {
  process.nextTick(cb, null, {
    parserOpts,
    writerOpts,
    whatBump,
  });
}
