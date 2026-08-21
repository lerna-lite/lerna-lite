import parserOpts from './parser-opts.js';
import whatBump from './what-bump.js';

export default {
  parser: parserOpts,
  whatBump,
  writer: {
    groupBy: 'type',
  },
};
