export const publishCommandOptions = {
  c: {
    describe: 'Publish packages after every successful merge using the sha as part of the tag.',
    group: 'Version Command Options:',
    alias: 'canary',
    type: 'boolean',
  },
  // preid is copied from ../version/command because a whitelist for one option isn't worth it
  preid: {
    describe: 'Specify the prerelease identifier when publishing a prerelease',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
    defaultDescription: 'alpha',
  },
  contents: {
    describe: 'Subdirectory to publish. Must apply to ALL packages.',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
    defaultDescription: '.',
  },
  'dist-tag': {
    describe: 'Publish packages with the specified npm dist-tag',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
  },
  'legacy-auth': {
    describe: 'Legacy Base64 Encoded username and password.',
    group: 'Version Command Options:',
    type: 'string',
  },
  'pre-dist-tag': {
    describe: 'Publish prerelease packages with the specified npm dist-tag',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
  },
  'git-head': {
    describe: 'Explicit SHA to set as gitHead when packing tarballs, only allowed with "from- package" positional.',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
  },
  'graph-type': {
    describe: 'Type of dependency to use when determining package hierarchy.',
    group: 'Version Command Options:',
    choices: ['all', 'dependencies'],
    defaultDescription: 'dependencies',
  },
  'ignore-prepublish': {
    describe: 'Disable deprecated "prepublish" lifecycle script',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'ignore-scripts': {
    describe: 'Disable all lifecycle scripts',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  // TODO: (major) make --no-granular-pathspec the default
  'no-granular-pathspec': {
    describe: 'Do not reset changes file-by-file, but globally.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'granular-pathspec': {
    // proxy for --no-granular-pathspec
    hidden: true,
    // describe: 'Reset changes file-by-file, not globally.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  otp: {
    describe: 'Supply a one-time password for publishing with two-factor authentication.',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
  },
  registry: {
    describe: 'Use the specified registry for all npm client operations.',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
  },
  'require-scripts': {
    describe: 'Execute ./scripts/prepublish.js and ./scripts/postpublish.js, relative to package root.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'no-git-reset': {
    describe: 'Do not reset changes to working tree after publishing is complete.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'git-reset': {
    // proxy for --no-git-reset
    hidden: true,
    type: 'boolean',
  },
  'temp-tag': {
    describe: 'Create a temporary tag while publishing.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'no-verify-access': {
    describe: 'Do not verify package read-write access for current npm user.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'verify-access': {
    // proxy for --no-verify-access
    hidden: true,
    type: 'boolean',
  },
  // y: {
  //   describe: 'Skip all confirmation prompts.',
  //   group: 'Version Command Options:',
  //   alias: 'yes',
  //   type: 'boolean',
  // },
};
