export interface ExecCommandOption {
  /** command to execute by the command */
  cmd?: string;

  /** exec command arguments */
  args?: any;

  /** Displays the execution command that would be performed without executing it. */
  cmdDryRun?: boolean;

  /** Stream output with lines prefixed by originating package name. */
  stream?: boolean;

  /** Execute command with unlimited concurrency, streaming prefixed output. */
  parallel?: boolean;

  /** Continue executing command despite non-zero exit in a given package. */
  noBail?: boolean;

  /** proxy for --no-bail */
  bail?: boolean;

  // This option controls prefix for stream output so that it can be disabled to be friendly
  // to tools like Visual Studio Code to highlight the raw results
  /** Do not prefix streaming output. */
  noPrefix?: boolean;

  /** proxy for --no-prefix */
  prefix?: boolean;

  /** Profile command executions and output performance profile to default location. */
  profile?: boolean;

  /** Output performance profile to custom location instead of default project root. */
  profileLocation?: string;
}

export interface InitCommandOption {
  /** specify lerna dependency version in package.json without a caret (^) */
  exact?: boolean;

  /** version packages independently */
  independent?: boolean;
}

export interface PublishCommandOption extends VersionCommandOption {
  /** alias to '--canary' */
  c?: boolean;

  /** Publish packages after every successful merge using the sha as part of the tag. */
  canary?: boolean;

  /** Specify the prerelease identifier when publishing a prerelease */
  preid?: string;

  /** Subdirectory to publish. Must apply to ALL packages. */
  contents?: string;

  /** Publish packages with the specified npm dist-tag */
  distTag?: string;

  /** Legacy Base64 Encoded username and password. */
  legacyAuth?: string;

  /** Publish prerelease packages with the specified npm dist-tag */
  preDistTag?: string;

  /** Explicit SHA to set as gitHead when packing tarballs, only allowed with "from-package" positional. */
  gitHead?: string;

  /** Type of dependency to use when determining package hierarchy. */
  graphType: 'all' | 'dependencies';

  /** Disable deprecated "prepublish" lifecycle script */
  ignorePrepublish?: boolean;

  /** Disable all lifecycle scripts */
  ignoreScripts?: boolean;

  // TODO: (major) make --no-granular-pathspec the default
  /** Do not reset changes file-by-file, but globally. */
  noGranularPathspec?: boolean;

  /** proxy for --no-granular-pathspec */
  granularPathspec?: boolean;

  /** Supply a one-time password for publishing with two-factor authentication. */
  otp?: string;

  /** Use the specified registry for all npm client operations. */
  registry?: string;

  /** Execute ./scripts/prepublish.js and ./scripts/postpublish.js, relative to package root. */
  requireScripts?: boolean;

  /** Do not reset changes to working tree after publishing is complete. */
  noGitReset?: boolean;

  // proxy for --no-git-reset
  gitReset?: boolean;

  /** Create a temporary tag while publishing. */
  tempTag?: boolean;

  /** Do not verify package read-write access for current npm user. */
  noVerifyAccess?: boolean;

  /** proxy for --no-verify-access */
  verifyAccess?: boolean;

  /** alias to '--yes' */
  y?: boolean;

  /** Skip all confirmation prompts. */
  yes?: boolean;
}

export interface VersionCommandOption {
  /** Specify which branches to allow versioning from. */
  allowBranch?: string[];

  /** Amend the existing commit, instead of generating a new one. */
  amend?: boolean;

  /** conventional commit version bump type */
  bump: 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease' | 'from-git' | 'from-package';

  /** Use conventional-changelog to determine version bump and generate CHANGELOG. */
  conventionalCommits?: boolean;

  /** Version currently prereleased packages to a non-prerelease version. */
  conventionalGraduate?: boolean | string;

  /** Version changed packages as prereleases when using --conventional-commits. */
  conventionalPrerelease?: boolean | string;

  /** Add a custom message at the top of your "changelog.md" which is located in the root of your project. This option only works when using --conventional-commits. */
  changelogHeaderMessage?: string;

  /** Add a custom message as a prefix to each new version in your "changelog.md" which is located in the root of your project. This option only works when using --conventional-commits. */
  changelogVersionMessage?: string;

  /** Defaults 'angular', custom conventional-changelog preset. */
  changelogPreset?: string;

  /** Specify cross-dependency version numbers exactly rather than with a caret (^). */
  exact?: boolean;

  /** Always include targeted packages in versioning operations, skipping default logic. */
  forcePublish?: boolean | string;

  /** Displays the process command that would be performed without executing it. */
  gitDryRun?: boolean;

  /** Defaults to 'origin', push git changes to the specified remote. */
  gitRemote: string;

  /** Create an official GitHub or GitLab release for every version. */
  createRelease?: 'gitlab' | 'github';

  /**
   * Ignore changes in files matched by glob(s) when detecting changed packages.
   * Pass --no-ignore-changes to completely disable.
   */
  ignoreChanges?: string[];

  /** Disable all lifecycle scripts */
  ignoreScripts?: boolean;

  /** Include tags from merged branches when detecting changed packages. */
  includeMergedTags?: boolean;

  /** alias to '--message' */
  m?: string;

  /** Use a custom commit message when creating the version commit. */
  message?: string;

  /** Do not generate CHANGELOG.md files when using --conventional-commits. */
  noChangelog?: boolean;

  /** proxy for --no-changelog */
  changelog?: boolean;

  /** Do not run git commit hooks when committing version changes. */
  noCommitHooks?: boolean;

  /** proxy for --no-commit-hooks */
  commitHooks?: boolean;

  /** Do not commit or tag version changes. */
  noGitTagVersion?: boolean;

  /** proxy for --no-git-tag-version */
  gitTagVersion?: boolean;

  // TODO: (major) make --no-granular-pathspec the default
  /** Do not stage changes file-by-file, but globally. */
  noGranularPathspec?: boolean;

  /** Stage changes file-by-file, not globally. Proxy for --no-granular-pathspec */
  granularPathspec?: boolean;

  // TODO: (major) make --no-private the default
  /** Do not version private packages. */
  noPrivate?: boolean;

  /** proxy for --no-private */
  private?: boolean;

  /** Do not push tagged commit to git remote. */
  noPush?: boolean;

  /** proxy for --no-push */
  push?: boolean;

  // preid is copied into ../publish/command because a whitelist for one option isn't worth it
  /** Defaults to 'alpha', specify the prerelease identifier when versioning a prerelease */
  preid?: string;

  /** Pass the `--gpg-sign` flag to `git commit`. */
  signGitCommit?: boolean;

  /** Pass the `--signoff` flag to `git commit`. */
  signoffGitCommit?: boolean;

  /** Pass the `--sign` flag to `git tag`. */
  signGitTag?: boolean;

  /** Pass the `--force` flag to `git tag`. */
  forceGitTag?: boolean;

  /** Defaults to 'v', customize the tag prefix. To remove entirely, pass an empty string. */
  tagVersionPrefix?: string;

  /** Strict match transform version numbers to an exact range (like "1.2.3") rather than with a caret (like ^1.2.3) when using `workspace:*`. */
  workspaceStrictMatch?: boolean;

  /** alias to '--yes' */
  y?: boolean;

  /** Skip all confirmation prompts. */
  yes?: boolean;
}

export interface RunCommandOption {
  /** Displays the process command that would be performed without executing it. */
  cmdDryRun?: boolean;

  /** Defaults to 'npm', executable used to run scripts (npm, yarn, pnpm, ...). */
  npmClient?: string;

  /** Stream output with lines prefixed by package. */
  stream?: boolean;

  /** Run script with unlimited concurrency, streaming prefixed output. */
  parallel?: boolean;

  /** Continue running script despite non-zero exit in a given package. */
  noBail?: boolean;

  /** proxy for --no-bail */
  bail?: boolean;

  // This option controls prefix for stream output so that it can be disabled to be friendly
  // to tools like Visual Studio Code to highlight the raw results

  /** Do not prefix streaming output. */
  noPrefix?: boolean;

  /** proxy for --no-prefix */
  prefix?: boolean;

  /** Profile script executions and output performance profile to default location. */
  profile?: boolean;

  /** Output performance profile to custom location instead of default project root. */
  profileLocation?: string;

  /** npm script to run by the command */
  script: string;
}