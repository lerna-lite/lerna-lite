import log from 'npmlog';
// import semver from 'semver';
import { VersionCommand } from '@lerna-lite/version';
import { VersionCommandOption } from '@lerna-lite/core';

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */

let addBumpPositionalFn = function (yargs: any, additionalKeywords: string[] = []) {
  const semverKeywords = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'].concat(
    additionalKeywords
  );
  const bumpOptionList = `'${semverKeywords.slice(0, -1).join(`', '`)}', or '${
    semverKeywords[semverKeywords.length - 1]
  }'.`;

  yargs.positional('bump', {
    describe: `Increment version(s) by explicit version _or_ semver keyword,\n${bumpOptionList}`,
    type: 'string',
    // coerce: (choice = '') => {
    //   const versionBump = choice || yargs.argv.bump;

    //   if (versionBump && (!semver.valid(versionBump) || semverKeywords.indexOf(versionBump) === -1)) {
    //     throw new Error(`bump must be an explicit version string _or_ one of: ${bumpOptionList}`);
    //   }

    //   return versionBump;
    // },
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
      amend: {
        describe: 'Amend the existing commit, instead of generating a new one.',
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
          'Add a custom message at the top of your "changelog.md" which is located in the root of your project. This option only works when using --conventional-commits.',
        group: 'Version Command Options:',
        requiresArg: true,
        type: 'string',
      },
      'changelog-include-commit-author-fullname': {
        describe:
          "Specify if we want to include the commit author's name, when using conventional-commits with changelog. We can optionally provide a custom message or else a default format will be used.",
        group: 'Version Command Options:',
        requiresArg: false,
        type: 'string',
      },
      'changelog-version-message': {
        describe:
          'Add a custom message as a prefix to each new version in your "changelog.md" which is located in the root of your project. This option only works when using --conventional-commits.',
        group: 'Version Command Options:',
        requiresArg: true,
        type: 'string',
      },
      'changelog-preset': {
        describe: 'Custom conventional-changelog preset.',
        type: 'string',
        requiresArg: true,
        defaultDescription: 'angular',
      },
      exact: {
        describe: 'Specify cross-dependency version numbers exactly rather than with a caret (^).',
        type: 'boolean',
      },
      'force-publish': {
        describe: 'Always include targeted packages in versioning operations, skipping default logic.',
        // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
      },
      'git-dry-run': {
        describe: 'Displays the process command that would be performed without executing it.',
        group: 'Version Command Options:',
        type: 'boolean',
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
      'no-sync-workspace-lock': {
        describe:
          'Do not run `npm install --package-lock-only` or equivalent depending on the package manager defined in `npmClient`.',
        type: 'boolean',
      },
      'sync-workspace-lock': {
        describe:
          'Runs `npm install --package-lock-only` or equivalent depending on the package manager defined in `npmClient`.',
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

    return yargs
      .option('ignore', {
        // TODO: remove in next major release
        // NOT the same as filter-options --ignore
        hidden: true,
        conflicts: 'ignore-changes',
        type: 'array',
      })
      .option('cd-version', {
        // TODO: remove in next major release
        hidden: true,
        conflicts: 'bump',
        type: 'string',
        requiresArg: true,
      })
      .option('repo-version', {
        // TODO: remove in next major release
        hidden: true,
        conflicts: 'bump',
        type: 'string',
        requiresArg: true,
      })
      .option('skip-git', {
        // TODO: remove in next major release
        hidden: true,
        type: 'boolean',
      })
      .option('github-release', {
        // TODO: remove in next major release
        hidden: true,
        type: 'boolean',
      })
      .check((argv) => {
        /* eslint-disable no-param-reassign */
        if (argv.ignore) {
          argv.ignoreChanges = argv.ignore;
          delete argv.ignore;
          log.warn('deprecated', '--ignore has been renamed --ignore-changes');
        }

        if (argv.cdVersion && !argv.bump) {
          argv.bump = argv.cdVersion;
          delete argv.cdVersion;
          delete argv['cd-version'];
          log.warn('deprecated', '--cd-version has been replaced by positional [bump]');
        }

        if (argv.repoVersion && !argv.bump) {
          argv.bump = argv.repoVersion;
          delete argv.repoVersion;
          delete argv['repo-version'];
          log.warn('deprecated', '--repo-version has been replaced by positional [bump]');
        }

        if (argv.skipGit) {
          argv.gitTagVersion = false;
          argv['git-tag-version'] = false;
          argv.push = false;
          delete argv.skipGit;
          delete argv['skip-git'];
          log.warn('deprecated', '--skip-git has been replaced by --no-git-tag-version --no-push');
        }

        if (argv.githubRelease) {
          argv.createRelease = 'github';
          delete argv.githubRelease;
          log.warn('deprecated', '--github-release has been replaced by --create-release=github');
        }
        /* eslint-enable no-param-reassign */

        if (argv['--']) {
          log.warn('EDOUBLEDASH', 'Arguments after -- are no longer passed to subprocess executions.');
          log.warn('EDOUBLEDASH', 'This will cause an error in a future major version.');
        }

        return argv;
      });
  },

  handler: (argv: VersionCommandOption) => {
    return new VersionCommand(argv);
  },
};

export { addBumpPositional };
