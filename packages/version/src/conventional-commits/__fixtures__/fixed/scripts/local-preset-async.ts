// https://github.com/conventional-changelog/conventional-changelog/blob/b516084ef6a725197f148236c0ddbfae7ffe3e6f/packages/conventional-changelog-angular/conventional-recommended-bump.js
import parserOpts from './parser-opts.js';
import whatBump from './what-bump.js';
import writerOpts from './writer-opts.js';

module.exports = createPreset;

export async function createPreset(_config) {
  return {
    conventionalChangelog: {
      parserOpts,
      writerOpts,
    },
    recommendedBumpOpts: {
      parserOpts,
      whatBump,
    },
  };
}
