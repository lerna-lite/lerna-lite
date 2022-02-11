export const versionCommandOptions = {
  'allow-branch': {
    describe: 'Specify which branches to allow versioning from.',
    group: 'Version Command Options:',
    type: 'array',
  },
  amend: {
    describe: 'Amend the existing commit, instead of generating a new one.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'conventional-commits': {
    describe: 'Use conventional-changelog to determine version bump and generate CHANGELOG.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'conventional-graduate': {
    describe: 'Version currently prereleased packages to a non-prerelease version.',
    group: 'Version Command Options:',
    // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
  },
  'conventional-prerelease': {
    describe: 'Version changed packages as prereleases when using --conventional-commits.',
    group: 'Version Command Options:',
    // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
  },
  'changelog-header-message': {
    describe: 'Add a custom message at the top of your "changelog.md" which is located in the root of your project. This option only works when using --conventional-commits.',
    group: 'Version Command Options:',
    requiresArg: true,
    type: 'string'
  },
  'changelog-version-message': {
    describe: 'Add a custom message as a prefix to each new version in your "changelog.md" which is located in the root of your project. This option only works when using --conventional-commits.',
    group: 'Version Command Options:',
    requiresArg: true,
    type: 'string'
  },
  'changelog-preset': {
    describe: 'Custom conventional-changelog preset.',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
    defaultDescription: 'angular',
  },
  exact: {
    describe: 'Specify cross-dependency version numbers exactly rather than with a caret (^).',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'force-publish': {
    describe: 'Always include targeted packages in versioning operations, skipping default logic.',
    group: 'Version Command Options:',
    // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
  },
  'git-dry-run': {
    describe: 'Displays the process command that would be performed without executing it.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'git-remote': {
    describe: 'Push git changes to the specified remote.',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
    defaultDescription: 'origin',
  },
  'create-release': {
    describe: 'Create an official GitHub or GitLab release for every version.',
    group: 'Version Command Options:',
    type: 'string',
    choices: ['gitlab', 'github'],
  },
  'ignore-changes': {
    describe: [
      'Ignore changes in files matched by glob(s) when detecting changed packages.',
      'Pass --no-ignore-changes to completely disable.',
    ].join('\n'),
    group: 'Version Command Options:',
    type: 'array',
  },
  'ignore-scripts': {
    describe: 'Disable all lifecycle scripts',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'include-merged-tags': {
    describe: 'Include tags from merged branches when detecting changed packages.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  m: {
    describe: 'Use a custom commit message when creating the version commit.',
    group: 'Version Command Options:',
    alias: 'message',
    type: 'string',
    requiresArg: true,
  },
  'no-changelog': {
    describe: 'Do not generate CHANGELOG.md files when using --conventional-commits.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  changelog: {
    // proxy for --no-changelog
    hidden: true,
    type: 'boolean',
  },
  'no-commit-hooks': {
    describe: 'Do not run git commit hooks when committing version changes.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'commit-hooks': {
    // proxy for --no-commit-hooks
    hidden: true,
    type: 'boolean',
  },
  'no-git-tag-version': {
    describe: 'Do not commit or tag version changes.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'git-tag-version': {
    // proxy for --no-git-tag-version
    hidden: true,
    type: 'boolean',
  },
  // TODO: (major) make --no-granular-pathspec the default
  'no-granular-pathspec': {
    describe: 'Do not stage changes file-by-file, but globally.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'granular-pathspec': {
    // proxy for --no-granular-pathspec
    hidden: true,
    // describe: 'Stage changes file-by-file, not globally.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  // TODO: (major) make --no-private the default
  'no-private': {
    describe: 'Do not version private packages.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  private: {
    // proxy for --no-private
    hidden: true,
    type: 'boolean',
  },
  'no-push': {
    describe: 'Do not push tagged commit to git remote.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  push: {
    // proxy for --no-push
    hidden: true,
    type: 'boolean',
  },
  // preid is copied into ../publish/command because a whitelist for one option isn't worth it
  preid: {
    describe: 'Specify the prerelease identifier when versioning a prerelease',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
    defaultDescription: 'alpha',
  },
  'sign-git-commit': {
    describe: 'Pass the `--gpg-sign` flag to `git commit`.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'sign-git-tag': {
    describe: 'Pass the `--sign` flag to `git tag`.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'force-git-tag': {
    describe: 'Pass the `--force` flag to `git tag`.',
    group: 'Version Command Options:',
    type: 'boolean',
  },
  'tag-version-prefix': {
    describe: 'Customize the tag prefix. To remove entirely, pass an empty string.',
    group: 'Version Command Options:',
    type: 'string',
    requiresArg: true,
    defaultDescription: 'v',
  },
  y: {
    describe: 'Skip all confirmation prompts.',
    group: 'Version Command Options:',
    alias: 'yes',
    type: 'boolean',
  },
};

