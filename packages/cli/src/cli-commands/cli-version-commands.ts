import { VersionCommandOption } from '@lerna-lite/core';

import log from 'npmlog';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */

const addBumpPositionalFn = function (yargs: any, additionalKeywords: string[] = []) {
  const semverKeywords = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'].concat(additionalKeywords);
  const bumpOptionList = `'${semverKeywords.slice(0, -1).join(`', '`)}', or '${semverKeywords[semverKeywords.length - 1]}'.`;

  yargs.positional('bump', {
    describe: `Increment version(s) by explicit version _or_ semver keyword,\n${bumpOptionList}`,
    type: 'string',
  });
};
let addBumpPositional = addBumpPositionalFn;

export default {
  command: 'version [bump]',
  describe: 'Bump version of packages changed since the last release.',
  builder: (yargs: any, composed?: string) => {
    const opts = {
      'allow-branch': {
        describe: 'Specify which branches to allow versioning from.',
        type: 'array',
      },
      'allow-peer-dependencies-update': {
        describe: 'Allow bumping versions of peer dependencies.',
        type: 'boolean',
      },
      amend: {
        describe: 'Amend the existing commit, instead of generating a new one.',
        type: 'boolean',
      },
      'build-metadata': {
        describe: 'Apply build metadata to the release, compatible with SemVer.',
        requiresArg: true,
        type: 'string',
      },
      'conventional-bump-prerelease': {
        describe: 'Bumps prerelease versions if conventional commits requires it.',
        type: 'boolean',
      },
      'conventional-commits': {
        describe: 'Use conventional-changelog to determine version bump and generate CHANGELOG.',
        type: 'boolean',
      },
      'conventional-graduate': {
        describe: 'Version currently prereleased packages to a non-prerelease version.',
        // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
      },
      'conventional-prerelease': {
        describe: 'Version changed packages as prereleases when using --conventional-commits.',
        // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
      },
      'changelog-header-message': {
        describe:
          'Add a custom message at the top of all "changelog.md" files. This option is only available when using --conventional-commits with changelogs.',
        group: 'Version Command Options:',
        requiresArg: true,
        type: 'string',
      },
      'changelog-include-commits-git-author': {
        describe:
          "Specify if we want to include the commit git author's name, this option is only available when using --conventional-commits with changelogs. We can also optionally provide a custom message or else a default format will be used.",
        group: 'Version Command Options:',
        requiresArg: false,
        type: 'string',
      },
      'changelog-include-commits-client-login': {
        describe:
          'Specify if we want to include the commit remote client login name (ie GitHub username), this option is only available when using --conventional-commits with changelogs. We can also optionally provide a custom message or else a default format will be used.',
        group: 'Version Command Options:',
        requiresArg: false,
        type: 'string',
      },
      'changelog-preset': {
        describe: 'Custom conventional-changelog preset.',
        type: 'string',
        requiresArg: true,
        defaultDescription: 'angular',
      },
      'dry-run': {
        describe: 'Displays the process command that would be performed without executing it.',
        group: 'Version Command Options:',
        type: 'boolean',
      },
      exact: {
        describe: 'Specify cross-dependency version numbers exactly rather than with a caret (^).',
        type: 'boolean',
      },
      'exclude-dependents': {
        describe: `Exclude all transitive dependents when running a command with --since, overriding the default 'changed' algorithm.`,
        type: 'boolean',
      },
      'independent-subpackages': {
        describe: 'Exclude sub-packages when versioning',
        type: 'boolean',
      },
      'force-publish': {
        describe: 'Always include targeted packages in versioning operations, skipping default logic.',
        // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
      },
      'git-remote': {
        describe: 'Push git changes to the specified remote.',
        type: 'string',
        requiresArg: true,
        defaultDescription: 'origin',
      },
      'create-release': {
        describe: 'Create an official GitHub or GitLab release for every version.',
        type: 'string',
        choices: ['gitlab', 'github'],
      },
      'ignore-changes': {
        describe: [
          'Ignore changes in files matched by glob(s) when detecting changed packages.',
          'Pass --no-ignore-changes to completely disable.',
        ].join('\n'),
        type: 'array',
      },
      'ignore-scripts': {
        describe: 'Disable all lifecycle scripts',
        type: 'boolean',
      },
      'include-merged-tags': {
        describe: 'Include tags from merged branches when detecting changed packages.',
        type: 'boolean',
      },
      m: {
        describe: 'Use a custom commit message when creating the version commit.',
        alias: 'message',
        type: 'string',
        requiresArg: true,
      },
      'no-changelog': {
        describe: 'Do not generate CHANGELOG.md files when using --conventional-commits.',
        type: 'boolean',
      },
      changelog: {
        // proxy for --no-changelog
        hidden: true,
        type: 'boolean',
      },
      'no-commit-hooks': {
        describe: 'Do not run git commit hooks when committing version changes.',
        type: 'boolean',
      },
      'commit-hooks': {
        // proxy for --no-commit-hooks
        hidden: true,
        type: 'boolean',
      },
      'git-tag-command': {
        describe:
          'Allows users to specify a custom command to be used when applying git tags. For example, this may be useful for providing a wrapper command in CI/CD pipelines that have no direct write access.',
        type: 'string',
      },
      'no-git-tag-version': {
        describe: 'Do not commit or tag version changes.',
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
        type: 'boolean',
      },
      'granular-pathspec': {
        // proxy for --no-granular-pathspec
        hidden: true,
        // describe: 'Stage changes file-by-file, not globally.',
        type: 'boolean',
      },
      // TODO: (major) make --no-private the default
      'no-private': {
        describe: 'Do not version private packages.',
        type: 'boolean',
      },
      private: {
        // proxy for --no-private
        hidden: true,
        type: 'boolean',
      },
      'no-push': {
        describe: 'Do not push tagged commit to git remote.',
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
        type: 'string',
        requiresArg: true,
        defaultDescription: 'alpha',
      },
      'remote-client': {
        describe:
          'Remote git client, which client is used when reading commits from remote which is useful when associating client login for each changelog entry.',
        type: 'string',
        choices: ['gitlab', 'github'],
      },
      'sign-git-commit': {
        describe: 'Pass the `--gpg-sign` flag to `git commit`.',
        type: 'boolean',
      },
      'signoff-git-commit': {
        describe: 'Pass the `--signoff` flag to `git commit`.',
        type: 'boolean',
      },
      'sign-git-tag': {
        describe: 'Pass the `--sign` flag to `git tag`.',
        type: 'boolean',
      },
      'force-git-tag': {
        describe: 'Pass the `--force` flag to `git tag`.',
        type: 'boolean',
      },
      'tag-version-prefix': {
        describe: 'Customize the tag prefix. To remove entirely, pass an empty string.',
        type: 'string',
        requiresArg: true,
        defaultDescription: 'v',
      },
      'no-manually-update-root-lockfile': {
        describe: 'Do not manually update (read/write back to the lock file) the project root lock file.',
        type: 'boolean',
      },
      'manually-update-root-lockfile': {
        // proxy for --no-manually-update-root-lockfile
        hidden: true,
        type: 'boolean',
      },
      'npm-client-args': {
        describe: "Additional arguments to pass to the npm client when performing 'npm install'.",
        type: 'array',
      },
      'no-sync-workspace-lock': {
        describe:
          'Do not run `npm install --package-lock-only` or equivalent depending on the package manager defined in `npmClient`.',
        type: 'boolean',
      },
      'sync-workspace-lock': {
        describe: 'Runs `npm install --package-lock-only` or equivalent depending on the package manager defined in `npmClient`.',
        type: 'boolean',
      },
      'skip-bump-only-release': {
        describe: 'do we want to skip creating a release (github/gitlab) when the version is a "version bump only"?',
        type: 'boolean',
      },
      'workspace-strict-match': {
        describe:
          'Strict match transform version numbers to an exact range (like "1.2.3") rather than with a caret (like ^1.2.3) when using `workspace:*`.',
        type: 'boolean',
      },
      y: {
        describe: 'Skip all confirmation prompts.',
        alias: 'yes',
        type: 'boolean',
      },
    };

    if (composed) {
      // hide options from composed command's help output
      Object.keys(opts).forEach((key) => {
        opts[key].hidden = true;
      });

      // set argv.composed for wrapped execution logic
      yargs.default('composed', composed).hide('composed');
    } else {
      addBumpPositional = addBumpPositionalFn(yargs) as any;
    }

    yargs.options(opts);

    // workaround yargs bug that re-interprets unknown arguments in argv._
    yargs.parserConfiguration({
      'populate--': true,
    });

    if (!composed) {
      // hide options from composed command's help output
      yargs.group(Object.keys(opts), 'Command Options:');
    }

    return yargs.check((argv) => {
      if (argv['--']) {
        log.warn('EDOUBLEDASH', 'Arguments after -- are no longer passed to subprocess executions.');
        log.warn('EDOUBLEDASH', 'This will cause an error in a future major version.');
      }

      return argv;
    });
  },

  handler: async (argv: VersionCommandOption) => {
    try {
      // @ts-ignore
      // eslint-disable-next-line
      const { VersionCommand } = await import('@lerna-lite/version');
      new VersionCommand(argv);
    } catch (err: unknown) {
      console.error(
        `"@lerna-lite/version" is optional and was not found. Please install it with "npm install @lerna-lite/version -D -W".`,
        err
      );
    }
  },
};

export { addBumpPositional };
