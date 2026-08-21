import parserOpts from './parser-opts.js';
import whatBump from './what-bump.js';
import writerOpts from './writer-opts.js';

const { mainTemplate, ...legacyWriterOpts } = writerOpts;

export default {
  parser: parserOpts,
  whatBump,
  writer: {
    ...legacyWriterOpts,
    template: mainTemplate,
  },
};
