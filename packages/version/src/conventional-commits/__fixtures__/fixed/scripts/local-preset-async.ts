// https://github.com/conventional-changelog/conventional-changelog/blob/b516084ef6a725197f148236c0ddbfae7ffe3e6f/packages/conventional-changelog-angular/conventional-recommended-bump.js
import parser from './parser-opts.js';
import whatBump from './what-bump.js';
import writer from './writer-opts.js';

export default async function createPreset(_config: any) {
  return {
    parser: parser,
    writer: writer,
    whatBump,
  };
}
