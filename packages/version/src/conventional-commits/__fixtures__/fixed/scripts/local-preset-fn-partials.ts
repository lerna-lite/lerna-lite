import parserOpts from './parser-opts.js';
import whatBump from './what-bump.js';
import writerOpts from './writer-opts.js';

// This preset keeps the legacy string mainTemplate from writerOpts but replaces
// the individual partials with functions.  It exists solely to exercise the
// `typeof partial === 'function'` branch inside compilePartial() in
// normalizeWriterConfig (get-changelog-config.ts line 30).
export default {
  parser: parserOpts,
  whatBump,
  writer: {
    ...writerOpts,
    // Function partials – these hit the `typeof partial === 'function'` branch.
    headerPartial: (context: any) => `<a name="${context.version}"></a>\n## ${context.version}\n\n`,
    commitPartial: (context: any) => (context.header ? `* ${context.header}\n` : ''),
    footerPartial: () => '',
  },
};
