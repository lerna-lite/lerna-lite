[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/version?color=forest)](https://www.npmjs.com/package/@lerna-lite/version)
[![npm](https://img.shields.io/npm/v/@lerna-lite/version.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/version)

# @lerna-lite/version

## (`lerna version`) - Version command 📑

Lerna-Lite Version command, bump version of packages changed since the last release.

---

## Installation

```sh
# simple install or install it globally with -g
npm install @lerna-lite/cli -D -W

# then use it (see usage below)
lerna version
```

> **Note** please make sure that you have a `lerna.json` config file and a `version` property defined with either a fixed or independent mode (for example: `"version": "independent"`). An error will be thrown if you're missing any of them.

## Usage

```sh
lerna version 1.0.1   # explicit
lerna version patch   # semver keyword
lerna version         # select from prompt(s)
```

When run, this command does the following:

1. Identifies packages that have been updated since the previous tagged release.
2. Prompts for a new version.
3. Modifies package metadata to reflect new release, running appropriate [lifecycle scripts](#lifecycle-scripts) in root and per-package.
4. Commits those changes and tags the commit.
5. Pushes to the git remote.

## Positionals

### semver `bump`

```sh
lerna version [major | minor | patch | premajor | preminor | prepatch | prerelease]
# uses the next semantic version(s) value and this skips `Select a new version for...` prompt
```

When this positional parameter is passed, `lerna version` will skip the version selection prompt and [increment](https://github.com/npm/node-semver#functions) the version by that keyword.
You must still use the `--yes` flag to avoid all prompts.

## Prerelease

If you have any packages with a prerelease version number (e.g. `2.0.0-beta.3`) and you run `lerna version` with and a non-prerelease bump (`major`, `minor`, or `patch`), it will publish those previously pre-released packages _as well as_ the packages that have changed since the last release.

For projects using conventional commits, use the following flags for prerelease management:

- **[`--conventional-prerelease`](#--conventional-prerelease):** release current changes as prerelease versions.
- **[`--conventional-graduate`](#--conventional-graduate):** graduate prerelease versioned packages to stable versions.

Running `lerna version --conventional-commits` without the above flags will release current changes as prerelease only if the version is already in prerelease.

## Options

- [`@lerna/version`](#lernaversion)
  - [Usage](#usage)
  - [Positionals](#positionals)
    - [semver `bump`](#semver-bump)
  - [Prerelease](#prerelease)
  - [Options](#options)
    - [`--allow-branch <glob>`](#--allow-branch-glob)
    - [`--allow-peer-dependencies-update`](#--allow-peer-dependencies-update) (new)
    - [`--amend`](#--amend)
    - [`--build-metadata <buildMetadata>`](#--build-metadata)
    - [`--changelog-preset`](#--changelog-preset)
    - [`--conventional-commits`](#--conventional-commits)
    - [`--conventional-graduate`](#--conventional-graduate)
    - [`--conventional-prerelease`](#--conventional-prerelease)
    - [`--conventional-bump-prerelease`](#--conventional-bump-prerelease) (new)
    - [`--changelog-include-commits-git-author [msg]`](#--changelog-include-commits-git-author-msg) (new)
    - [`--changelog-include-commits-client-login [msg]`](#--changelog-include-commits-client-login-msg) (new)
    - [`--changelog-header-message <msg>`](#--changelog-header-message-msg) (new)
    - [`--changelog-version-message <msg>`](#--changelog-version-message-msg) (new)
    - [`--create-release <type>`](#--create-release-type)
    - [`--exact`](#--exact)
    - [`--independent-subpackages`](#--independent-subpackages)
    - [`--force-publish`](#--force-publish)
    - [`--git-tag-command <cmd>`](#--git-tag-command-cmd) (new)
    - [`--dry-run`](#--dry-run) (new)
    - [`--git-remote <name>`](#--git-remote-name)
    - [`--ignore-changes`](#--ignore-changes)
    - [`--ignore-scripts`](#--ignore-scripts)
    - [`--include-merged-tags`](#--include-merged-tags)
    - [`--message <msg>`](#--message-msg)
    - [`--no-changelog`](#--no-changelog)
    - [`--no-commit-hooks`](#--no-commit-hooks)
    - [`--no-git-tag-version`](#--no-git-tag-version)
    - [`--no-granular-pathspec`](#--no-granular-pathspec)
    - [`--no-private`](#--no-private)
    - [`--no-push`](#--no-push)
    - [`--no-manually-update-root-lockfile`](#--no-manually-update-root-lockfile)
    - [`--npm-client-args`](#--npm-client-args)
    - [`--preid`](#--preid)
    - [`--remote-client <type>`](#--remote-client-type)
    - [`--signoff-git-commit`](#--signoff-git-commit) (new)
    - [`--sign-git-commit`](#--sign-git-commit)
    - [`--sign-git-tag`](#--sign-git-tag)
    - [`--force-git-tag`](#--force-git-tag)
    - [`--tag-version-prefix`](#--tag-version-prefix)
    - [`--sync-workspace-lock`](#--sync-workspace-lock) (new)
    - [`--yes`](#--yes)
  - [Deprecated Options](#deprecated-options)
    - [`--cd-version`](#--cd-version)
    - [`--repo-version`](#--repo-version)
    - [`--skip-git`](#--skip-git)
  - [Tips](#tips)
    - [Generating Initial Changelogs](#generating-initial-changelogs)
  - [Lifecycle Scripts](#lifecycle-scripts)
  - [`workspace:` protocol](#workspace-protocol)

### `--allow-branch <glob>`

A whitelist of globs that match git branches where `lerna version` is enabled.
It is easiest (and recommended) to configure in `lerna.json`, but it is possible to pass as a CLI option as well.

```json
{
  "command": {
    "version": {
      "allowBranch": "main"
    }
  }
}
```

With the configuration above, the `lerna version` will fail when run from any branch other than `main`.
It is considered a best-practice to limit `lerna version` to the primary branch alone.

```json
{
  "command": {
    "version": {
      "allowBranch": ["main", "feature/*"]
    }
  }
}
```

With the preceding configuration, `lerna version` will be allowed in any branch prefixed with `feature/`.
Please be aware that generating git tags in feature branches is fraught with potential errors as the branches are merged into the primary branch. If the tags are "detached" from their original context (perhaps through a squash merge or a conflicted merge commit), future `lerna version` executions will have difficulty determining the correct "diff since last release."

It is always possible to override this "durable" config on the command-line.
Please use with caution.

```sh
lerna version --allow-branch hotfix/oops-fix-the-thing
```

### `--allow-peer-dependencies-update`

```sh
lerna version --allow-peer-dependencies-update
```

By default peer dependencies versions will not be bumped unless this flag is enabled. When the package to be bumped is found in regular `dependencies` (or `devDependencies`) and also in `peerDependencies`, then it will bump both of them to the same version.

> **Note** peer dependency that includes a semver range with an operator (ie `>=2.0.0`) will never be mutated even if this flag is enabled.

> **Note** Please use with caution when enabling this option, it is not recommended for most users since the npm standard is to never mutate (bump) any `peerDependencies` when publishing new version in an automated fashion, at least not without a user intervention, as explained by core Lerna maintainer:

> > _Changes to a peer version range are always semver major, and should be as broad as possible._
> > _Until we can get fancier, we should never automatically modify them to match the new version being published (which is the current incorrect behavior)._

#### Examples
##### with flag enabled
with the new flag both deps would be updated and bumped, for example if we do a `minor` bump
```sh
{
  "name": "B",
  "dependencies": {
    "A": "workspace:^1.2.0"   // will update to "workspace:^1.3.0",
    "B": "^0.4.0":            // will update to "^0.5.0"
   },
  "peerDependencies": {
    "A": "workspace:^1.2.0"   // will update to "workspace:^1.3.0"
    "B": ">=0.2.0":           // will not be updateed because range with operator (>=) are skipped
  }
}
```

##### without flag
without the flag it will only update the first package it finds, that is `dependencies` in this case, so peer deps would never be updated
```sh
{
  "name": "B",
  "dependencies": {
    "A": "workspace:^1.2.0"   // will update to "workspace:^1.3.0"
    "B": "^0.4.0":            // will update to "^0.5.0"
   },
  "peerDependencies": {
    "A": "workspace:^1.2.0"   // will NEVER be updateed
    "B": ">=0.2.0":           // will NEVER be updateed
  }
}
```

#### Some Exclusions
with the flag enabled, it will update regular semver like these
- `1.2.3`
- `^1.2.3`
- `^1.4.0-alpha.0`
- `workspace:^1.2.3`

but it will never update or change versions with ranges
- `>=1.0.0`
- `>=1.0.0 <2.0.0`
- `^1 | ^2 | ^3`

### `--amend`

```sh
lerna version --amend
# commit message is retained, and `git push` is skipped.
```

When run with this flag, `lerna version` will perform all changes on the current commit, instead of adding a new one.
This is useful during [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to reduce the number of commits in the project's history.

In order to prevent unintended overwrites, this command will skip `git push` (i.e., it implies `--no-push`).

### `--build-metadata`

```sh
lerna version --build-metadata 001
```

Build metadata must be [SemVer compatible](https://semver.org/#spec-item-10). When provided it will apply to all updated packages, irrespective of whether independent or fixed versioning is utilised. If prompted to choose package version bumps, you can request a custom version to alter or remove build metadata for specific packages.

### `--changelog-preset`

```sh
lerna version --conventional-commits --changelog-preset angular-bitbucket
```

By default, the changelog preset is set to [`angular`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular#angular-convention).
In some cases you might want to change either use a another preset or a custom one.

Presets are names of built-in or installable configuration for conventional changelog.
Presets may be passed as the full name of the package, or the auto-expanded suffix
(e.g., `angular` is expanded to `conventional-changelog-angular`).

This option can also be specified in `lerna.json` configuration:

```json
{
  "changelogPreset": "angular"
}
```

If the preset exports a builder function (e.g. `conventional-changelog-conventionalcommits`), you can specify the [preset configuration](https://github.com/conventional-changelog/conventional-changelog-config-spec) too:

```json
{
  "changelogPreset": {
    "name": "conventionalcommits",
    "issueUrlFormat": "{{host}}/{{owner}}/{{repository}}/issues/{{id}}"
  }
}
```

### `--conventional-commits`

```sh
lerna version --conventional-commits
```

When run with this flag, `lerna version` will use the [Conventional Commits Specification](https://conventionalcommits.org/) to [determine the version bump](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-recommended-bump) and [generate CHANGELOG.md files](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli).

Passing [`--no-changelog`](#--no-changelog) will disable the generation (or updating) of `CHANGELOG.md` files.

### `--conventional-graduate`

```sh
lerna version --conventional-commits --conventional-graduate=package-2,package-4

# force all prerelease packages to be graduated
lerna version --conventional-commits --conventional-graduate
```

When run with this flag, `lerna version` will graduate the specified packages (comma-separated) or all packages using `*`. This command works regardless of whether the current HEAD has been released, similar to `--force-publish`, except that any non-prerelease packages are ignored. If changes are present for packages that are not specified (if specifying packages), or for packages that are not in prerelease, those packages will be versioned as they normally would using `--conventional-commits`.

"Graduating" a package means bumping to the non-prerelease variant of a prerelease version, eg. `package-1@1.0.0-alpha.0 => package-1@1.0.0`.

> **Note** when specifying packages, dependents of specified packages will be released, but will not be graduated.

### `--conventional-prerelease`

```sh
lerna version --conventional-commits --conventional-prerelease=package-2,package-4

# force all changed packages to be prereleased
lerna version --conventional-commits --conventional-prerelease
```

When run with this flag, `lerna version` will release with prerelease versions the specified packages (comma-separated) or all packages using `*`. Releases all unreleased changes as pre(patch/minor/major/release) by prefixing the version recommendation from `conventional-commits` with `pre`, eg. if present changes include a feature commit, the recommended bump will be `minor`, so this flag will result in a `preminor` release. If changes are present for packages that are not specified (if specifying packages), or for packages that are already in prerelease, those packages will be versioned as they normally would using `--conventional-commits`.

### `--changelog-include-commits-git-author [msg]`
Specify if we want to include the git commit author's name to the end of each changelog commit entry and wrapped in `(...)`. You could also provide a custom format by using any of these tokens (`%a`, `%e`), see examples below.
- `%a`: git author name, ie: ("Whitesource Renovate")
- `%e`: git author email, ie: ("bot@renovateapp.com")

This option is only available when using `--conventional-commits` with changelogs enabled.

> **Note** the author name is what the user has configured in git, for more info please refer to [Git Configuration](https://www.git-scm.com/book/en/v2/Customizing-Git-Git-Configuration). Also note, that is **not** the same as a remote client GitHub login username, Git does not store such information in its commit history, for that you will want to use the next option shown below.

```sh
# default format, without any argument
# will add the author name wrapped in (...) and appended to the commit line entry
lerna version --conventional-commits --changelog-include-commits-git-author
# **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/.../978bf36)) (Whitesource Renovate)

## custom format with 1 of these 2 tokens: %a and/or %e ##
lerna version --conventional-commits --changelog-include-commits-git-author " (by _%a_)"
# **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/.../978bf36)) (by _Whitesource Renovate_)

lerna version --conventional-commits --changelog-include-commits-client-login " by %a (%e)" --remote-client github
# **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/.../978bf36)) by _Whitesource Renovate (bot@renovateapp.com)
```

> We recommend you first try it with the `--dry-run` option so that you can validate your remote client access and inspect the changelog output. Make sure to revert your changes once you're satisfied with the output.

### `--changelog-include-commits-client-login [msg]`
Specify if we want to include commit remote client login (ie GitHub login username) to the end of each changelog commit entry and wrapped in `(@...)`. You could also provide a custom format by using any of these tokens (`%l`, `%a`, `%e`), see examples below.
- `%l`: remote client login, ie ("@renovate-bot")
- `%a`: git author name, ie: ("Whitesource Renovate")
- `%e`: git author email, ie: ("bot@renovateapp.com")

This option is only available when using `--conventional-commits` with changelogs enabled. You must also provide 1 of these 2 options [`--create-release <type>`](#--create-release-type) or [`--remote-client <type>`](#--remote-client-type)

> **Note** this will execute one or more client remote API calls (GH is limited to 100 per query), which at the moment is only supporting the GitHub client type. This option will also require a valid `GH_TOKEN` with read access permissions to the GitHub API so that it can execute the query to fetch all commit details since the last release, for more info refer to the [`Remote Client Auth Tokens`](#remote-client-auth-tokens) below.

> **Note** for this option to work properly, you must make sure that your local commits, on the current branch, are in sync with the remote server. It will then try to match all commits with their respective remote server commits and from there extract their associated remote client user login.

```sh
# default format, without any argument
# will add the remote client login name wrapped in (@...) and appended to the commit line entry
lerna version --conventional-commits --changelog-include-commits-client-login --create-release github
# **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/.../978bf36)) (@renovate-bot)

## custom format with 1 of these 3 tokens: %l, %a and/or %e ##
lerna version --conventional-commits --changelog-include-commits-client-login " by @%l" --remote-client github
# **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/.../978bf36)) by @renovate-bot

lerna version --conventional-commits --changelog-include-commits-client-login " by @%l, %a (%e)" --remote-client github
# **deps:** update dependency git-url-parse to v12 ([978bf36](https://github.com/.../978bf36)) by @renovate-bot, _Whitesource Renovate (bot@renovateapp.com)
```

> We recommend you first try it with the `--dry-run` option so that you can validate your remote client access and inspect the changelog output. Make sure to revert your changes once you're satisfied with the output.


### `--changelog-header-message <msg>`

Add a custom message at the top of all "changelog.md" files. This option is only available when using `--conventional-commits` and will only impact your project root "changelog.md".

```sh
lerna version --conventional-commits --changelog-header-message "My Custom Header Message"
```

### `--changelog-version-message <msg>`

Add a custom message as a prefix to your new version in your "changelog.md" which is located in the root of your project. This option is only available when using `--conventional-commits` and will only impact your project root "changelog.md".

```sh
lerna version --conventional-commits --changelog-version-message "My Great New Version Message"
```

### `--conventional-bump-prerelease`

```sh
lerna version --conventional-commits --conventional-prerelease --conventional-bump-prerelease
```

When run with this flag, `lerna version` will release with bumped prerelease versions even if already released packages are prereleases. Releases all unreleased changes as pre(patch/minor/major/release) by prefixing the version recommendation from `conventional-commits` with `pre`, eg. if present changes include a feature commit, the recommended bump will be `minor`, so this flag will result in a `preminor` release. If not used just a prerelease bump will be applied to prereleased packages.

```sh
Changes:
 - major: 1.0.0-alpha.0 => 2.0.0-alpha.0
 - minor: 1.0.0-alpha.0 => 1.1.0-alpha.0
 - patch: 1.0.0-alpha.0 => 1.0.1-alpha.0
```

### `--create-release <type>`

```sh
lerna version --conventional-commits --create-release github
lerna version --conventional-commits --create-release gitlab
```

When run with this flag, `lerna version` will create an official GitHub or GitLab release based on the changed packages. Requires `--conventional-commits` to be passed so that changelogs can be generated.

### Remote Client Auth Tokens
##### GitHub Auth Token
To authenticate with GitHub, the following environment variables can be defined.

- `GH_TOKEN` (required) - Your GitHub authentication token (under Settings > Developer settings > Personal access tokens), please give it the `repo:public_repo` scope when creating the token (for more info, refer to [GitHub - Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)).
- `GHE_API_URL` - When using GitHub Enterprise, an absolute URL to the API.
- `GHE_VERSION` - When using GitHub Enterprise, the currently installed GHE version. [Supports the following versions](https://github.com/octokit/plugin-enterprise-rest.js).

> **Note** even though `GH_TOKEN` is the preferred way to automate the creation of a GitHub Release (especially in a CI environment), we actually provide a more manual mode which is when the `GH_TOKEN` is not found. In this mode, we will create a link that once click will open the GitHub web interface form with the fields pre-populated. This mode is enabled automatically when the `GH_TOKEN` environment variable is not set and `--create-release github` is provided.

##### GitLab Auth Token
To authenticate with GitLab, the following environment variables can be defined.

- `GL_TOKEN` (required) - Your GitLab authentication token (under User Settings > Access Tokens).
- `GL_API_URL` - An absolute URL to the API, including the version. (Default: https://gitlab.com/api/v4)

> **Note** When using this option, you cannot pass [`--no-changelog`](#--no-changelog).

### `--exact`

```sh
lerna version --exact
```

When run with this flag, `lerna version` will specify updated dependencies in updated packages exactly (with no punctuation), instead of as semver compatible (with a `^`).

For more information, see the package.json [dependencies](https://docs.npmjs.com/files/package.json#dependencies) documentation.

### `--independent-subpackages`

```sh
lerna version --independent-subpackages
```

If `package B`, being a child of `package A`, has changes they will normally both get bumped although `package A` itself is eventually unchanged. If this flag is enabled and only `package B` was actually changed, `package A` will not get bumped if it does not have any changes on its own.

### `--force-publish`

```sh
lerna version --force-publish=package-2,package-4

# force all packages to be versioned
lerna version --force-publish
```

When run with this flag, `lerna version` will force publish the specified packages (comma-separated) or all packages using `*`.

> This will skip the `lerna changed` check for changed packages and forces a package that didn't have a `git diff` change to be updated.

### `--dry-run`

Displays the git command that would be performed without actually executing it, however please note that it will still create all the changelogs. This could be helpful for troubleshooting and also to see changelog changes without committing them to Git.

> **Note** changelogs will still be created (when enabled) even in dry-run mode, so it could be useful to see what gets created without them being committed (however, make sure to revert the changes and roll back your version in `lerna.json` once you're satisfied with the output).

```sh
$ lerna run watch --dry-run
```

### `--git-tag-command <cmd>`

Allows users to specify a custom command to be used when applying git tags. For example, this may be useful for providing a wrapper command in CI/CD pipelines that have no direct write access.

```sh
lerna version --git-tag-command "git gh-tag %s -m %s"
```

This can also be configured in `lerna.json`.

```json
{
  "command": {
    "version": {
      "gitTagCommand": "git gh-tag %s -m %s"
    }
  }
}
```

### `--git-remote <name>`

```sh
lerna version --git-remote upstream
```

When run with this flag, `lerna version` will push the git changes to the specified remote instead of `origin`.

### `--ignore-changes`

Ignore changes in files matched by glob(s) when detecting changed packages.

```sh
lerna version --ignore-changes '**/*.md' '**/__tests__/**'
```

This option is best specified as root `lerna.json` configuration, both to avoid premature shell evaluation of the globs and to share the config with `lerna diff` and `lerna changed`:

```json
{
  "ignoreChanges": ["**/__fixtures__/**", "**/__tests__/**", "**/*.md"]
}
```

Pass `--no-ignore-changes` to disable any existing durable configuration.

> In the following cases, a package will always be published, regardless of this option:
>
> 1. The latest release of the package is a `prerelease` version (i.e. `1.0.0-alpha`, `1.0.0–0.3.7`, etc.).
> 2. One or more linked dependencies of the package have changed.

### `--ignore-scripts`

When passed, this flag will disable running [lifecycle scripts](#lifecycle-scripts) during `lerna version`.

### `--include-merged-tags`

```sh
lerna version --include-merged-tags
```

Include tags from merged branches when detecting changed packages.

### `--message <msg>`

This option is aliased to `-m` for parity with `git commit`.

```sh
lerna version -m "chore(release): publish %s"
# commit message = "chore(release): publish v1.0.0"

lerna version -m "chore(release): publish %v"
# commit message = "chore(release): publish 1.0.0"

# When versioning packages independently, no placeholders are replaced
lerna version -m "chore(release): publish"
# commit message = "chore(release): publish
#
# - package-1@3.0.1
# - package-2@1.5.4"
```

When run with this flag, `lerna version` will use the provided message when committing the version updates
for publication. Useful for integrating lerna into projects that expect commit messages to adhere
to certain guidelines, such as projects which use [commitizen](https://github.com/commitizen/cz-cli) and/or [semantic-release](https://github.com/semantic-release/semantic-release).

If the message contains `%s`, it will be replaced with the new global version version number prefixed with a "v".
If the message contains `%v`, it will be replaced with the new global version version number without the leading "v".
Note that this placeholder interpolation only applies when using the default "fixed" versioning mode, as there is no "global" version to interpolate when versioning independently.

This can be configured in `lerna.json`, as well:

```json
{
  "command": {
    "version": {
      "message": "chore(release): publish %s"
    }
  }
}
```

### `--no-changelog`

```sh
lerna version --conventional-commits --no-changelog
```

When using `conventional-commits`, do not generate any `CHANGELOG.md` files.

> **Note** When using this option, you cannot pass [`--create-release`](#--create-release-type).

### `--no-commit-hooks`

By default, `lerna version` will allow git commit hooks to run when committing version changes.
Pass `--no-commit-hooks` to disable this behavior.

This option is analogous to the `npm version` option [`--commit-hooks`](https://docs.npmjs.com/cli/v8/using-npm/config#commit-hooks), just inverted.

### `--no-git-tag-version`

By default, `lerna version` will commit changes to package.json files and tag the release.
Pass `--no-git-tag-version` to disable the behavior.

This option is analogous to the `npm version` option [`--git-tag-version`](https://docs.npmjs.com/cli/v8/using-npm/config#git-tag-version), just inverted.

### `--no-granular-pathspec`

By default, `lerna version` will `git add` _only_ the leaf package manifests (and possibly changelogs) that have changed during the versioning process. This yields the equivalent of `git add -- packages/*/package.json`, but tailored to _exactly_ what changed.

If you **know** you need different behavior, you'll understand: Pass `--no-granular-pathspec` to make the git command _literally_ `git add -- .`. By opting into this [pathspec](https://git-scm.com/docs/gitglossary#Documentation/gitglossary.txt-aiddefpathspecapathspec), you **MUST HAVE _ALL_ SECRETS AND BUILD OUTPUT PROPERLY IGNORED, _OR IT WILL BE COMMITTED AND PUSHED_**.

This option makes the most sense configured in `lerna.json`, as you really don't want to mess it up:

```json
{
  "version": "independent",
  "granularPathspec": false
}
```

The root-level configuration is intentional, as this also covers the [identically-named option in `lerna publish`](https://github.com/lerna-lite/lerna-lite/blob/main/packages/publish/README.md#--no-granular-pathspec).

### `--no-private`

By default, `lerna version` will include private packages when choosing versions, making commits, and tagging releases.
Pass `--no-private` to disable this behavior.

Note that this option does _not_ exclude [private scoped packages](https://docs.npmjs.com/about-private-packages), only those with a [`"private": true` field](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#private) in their package.json file.

### `--no-push`

By default, `lerna version` will push the committed and tagged changes to the configured [git remote](#--git-remote-name).
Pass `--no-push` to disable this behavior.

### `--no-manually-update-root-lockfile`

When using pnpm or npm >= 7, the default config is to have Lerna-Lite update the npm `package-lock.json` directly and even though that does work, it came with some drawback and you can now disable this option via this flag

```sh
lerna version --no-manually-update-root-lockfile
```

A newer and better option is to this use the new flag [--sync-workspace-lock](#--sync-workspace-lock) which will to rely on your package manager client to do the work (via `install lockfile-only`) which is a lot more reliable, future proof and requires a lot less code in Lerna-Lite itself.

### `--npm-client-args`

This option allows arguments to be passed to the `npm install` that `lerna version` performs to update the lockfile (when `--sync-workspace-lock` is enabled).

For example:

```sh
lerna version 3.3.3 --sync-workspace-lock --npm-client-args=--legacy-peer-deps
lerna version 3.3.3 --sync-workspace-lock --npm-client-args="--legacy-peer-deps,--force"
lerna version 3.3.3 --sync-workspace-lock --npm-client-args="--legacy-peer-deps --force"
```

This can also be set in `lerna.json`:

```json
{
  ...
  "npmClientArgs": ["--legacy-peer-deps", "--production"]
}
```

or specifically for the version command:

```json
{
  ...
  "command": {
    "version": {
      "npmClientArgs": ["--legacy-peer-deps", "--production"]
    }
  }
}
```

### `--preid`

```sh
lerna version prerelease
# uses the next semantic prerelease version, e.g.
# 1.0.0 => 1.0.1-alpha.0

lerna version prepatch --preid next
# uses the next semantic prerelease version with a specific prerelease identifier, e.g.
# 1.0.0 => 1.0.1-next.0
```

When run with this flag, `lerna version` will increment `premajor`, `preminor`, `prepatch`, or `prerelease` semver
bumps using the specified [prerelease identifier](http://semver.org/#spec-item-9).

### `--remote-client <type>`

Define which remote client type is used, this option is only useful with the option [`--changelog-include-commits-client-login [msg]`](#--changelog-include-commits-client-login-msg)

```sh
lerna version --conventional-commits --remote-client github
lerna version --conventional-commits --remote-client gitlab
```

For remote client authentication tokens, like `GH_TOKEN`, refer to [`Remote Client Auth Tokens`](#remote-client-auth-tokens)

### `--signoff-git-commit`

Adds the `--signoff` flag to the git commit done by lerna version when executed.

> **Note** This is different from `--sign-git-commit` which is about gpg signatures.

### `--sign-git-commit`

This option is analogous to the `npm version` [option](https://docs.npmjs.com/cli/v8/using-npm/config#sign-git-commit) of the same name.

### `--sign-git-tag`

This option is analogous to the `npm version` [option](https://docs.npmjs.com/cli/v8/using-npm/config#sign-git-tag) of the same name.

### `--force-git-tag`

This option replaces any existing tag instead of failing.

### `--tag-version-prefix`

This option allows to provide custom prefix instead of the default one: `v`.

Keep in mind that currently you have to supply it twice: for `version` command and for `publish` command:

```bash
# locally
lerna version --tag-version-prefix=''
# on ci
lerna publish from-git --tag-version-prefix=''
```

### `--sync-workspace-lock`

This flag will leverage your package manager client to update the project lock file (ie `npm install --package-lock-only`) it relies heavily on the [npmClient](https://github.com/lerna-lite/lerna-lite/wiki/lerna.json#concepts) defined in your [lerna.json](https://github.com/lerna-lite/lerna-lite/wiki/lerna.json) config (`pnpm`, `yarn` or `npm` which is default) so make sure you have it configured correctly, this process will also include the lock file as part of your git change history once processed. This technique should be much more future proof and safer than having Lerna-Lite doing the actual work of updating the lock file which is not always ideal, neither safe, this flag is one of two solutions (the best option when available) to update the lock file. It might not be the best solution for your use case (ie it doesn't work with yarn classic), see all client notes below:

#### Notes for each client:

> `npm` users: we recommend having npm client version >=8.5.0 installed, so that we can run `npm install --package-lock-only` instead of `npm shrinkwrap` with version < 8.5.0 which would require an extra, and negative, step of renaming the lock file after execution. Also note that npm >=8.5.0 will become the minimal requirement in the future.

> `pnpm`/`yarn` users: we recommend using the [`workspace:` protocol](#workspace-protocol) since it will prefer local dependencies and will make it less likely to fetch packages accidentally from the registry.

> `yarn` users: please note that this will only work with Yarn Berry 3.x and higher since it uses `yarn install --mode update-lockfile` (this will not work with yarn 1.x classic)

```sh
lerna version --sync-workspace-lock
```

Depending on the `npmClient` defined, it will perform the following:

```sh
# npm is assuming a `package-lock.json` lock file
# we highly recommend npm client >= 8.5.0
npm install --package-lock-only     # npm client >= 8.5.0
npm shrinkwrap --package-lock-only  # npm client < 8.5.0 will execute a file rename of shrinkwrap file behind the scene

# pnpm is assuming a "pnpm-lock.yaml" lock file and "npmClient": "pnpm"
pnpm install --lockfile-only --ignore-scripts

# yarn is assuming a "yarn.lock" lock file and "npmClient": "yarn"
yarn install --mode update-lockfile
```

### `--yes`

```sh
lerna version --yes
# skips `Are you sure you want to publish these packages?`
```

When run with this flag, `lerna version` will skip all confirmation prompts.
Useful in [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to automatically answer the publish confirmation prompt.

## Deprecated Options
_these options will be removed in the next major version_

### `--cd-version`

Pass the semver keyword to the [`bump`](#semver-bump) positional instead.

### `--repo-version`

Pass an explicit version number to the [`bump`](#semver-bump) positional instead.

### `--skip-git`

Use [`--no-git-tag-version`](#--no-git-tag-version) and [`--no-push`](#--no-push) instead.

> **Note** This option **does not** restrict _all_ git commands from being executed. `git` is still required by `lerna version`.

## Tips

### Generating Initial Changelogs

If you start using the [`--conventional-commits`](#--conventional-commits) option _after_ the monorepo has been active for awhile, you can still generate changelogs for previous releases using [`conventional-changelog-cli`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli#readme) and [`lerna exec`](https://github.com/lerna/lerna/tree/main/commands/exec#readme):

```bash
# Lerna does not actually use conventional-changelog-cli, so you need to install it temporarily
npm i -D conventional-changelog-cli
# Documentation: `npx conventional-changelog --help`

# fixed versioning (default)
# run in root, then leaves
npx conventional-changelog --preset angular --release-count 0 --outfile ./CHANGELOG.md --verbose
lerna exec --concurrency 1 --stream -- 'conventional-changelog --preset angular --release-count 0 --commit-path $PWD --pkg $PWD/package.json --outfile $PWD/CHANGELOG.md --verbose'

# independent versioning
# (no root changelog)
lerna exec --concurrency 1 --stream -- 'conventional-changelog --preset angular --release-count 0 --commit-path $PWD --pkg $PWD/package.json --outfile $PWD/CHANGELOG.md --verbose --lerna-package $LERNA_PACKAGE_NAME'
```

If you use a custom [`--changelog-preset`](#--changelog-preset), you should change `--preset` value accordingly in the example above.

## Lifecycle Scripts

```js
// preversion:    Run BEFORE bumping the package version.
// version:       Run AFTER bumping the package version, but BEFORE commit.
// postversion:   Run AFTER bumping the package version, and AFTER commit.
```

lerna will run [npm lifecycle scripts](https://docs.npmjs.com/cli/v8/using-npm/scripts#life-cycle-scripts) during `lerna version` in the following order:

1. Detect changed packages, choose version bump(s)
2. Run `preversion` lifecycle in root
3. For each changed package, in topological order (all dependencies before dependents):
   1. Run `preversion` lifecycle
   2. Update version in package.json
   3. Run `version` lifecycle
4. Run `version` lifecycle in root
5. Add changed files to index, if [enabled](#--no-git-tag-version)
6. Create commit and tag(s), if [enabled](#--no-git-tag-version)
7. For each changed package, in _lexical_ order (alphabetical according to directory structure):
   1. Run `postversion` lifecycle
8. Run `postversion` lifecycle in root
9. Push commit and tag(s) to remote, if [enabled](#--no-push)
10. Create release, if [enabled](#--create-release-type)

# `workspace:` protocol

The `workspace:` protocol ([pnpm workspace](https://pnpm.io/workspaces), [yarn workspace](https://yarnpkg.com/features/workspaces#workspace-ranges-workspace)) is also supported by Lerna-Lite. We also strongly suggest that you use this in combo with the new [`--sync-workspace-lock`](#--sync-workspace-lock) flag to properly update your root project lock file. When versioning `workspace:` dependencies, it will do the following:

- fixed target workspace will remain untouched (if you use `workspace:*`, `workspace:~`, or `workspace:^`)
- semver range workspace will be bumped (if you use `workspace:^1.2.3`)

So for example, if we have `foo`, `bar`, `qar`, `zoo` in the workspace and they are all at version `1.5.0` and a `minor` bump is requested, then the following:

```json
{
  "dependencies": {
    "foo": "workspace:*",
    "bar": "workspace:~",
    "qar": "workspace:^",
    "zoo": "workspace:^1.5.0"
  }
}
```

Will apply the following updates to your `package.json` (assuming a `minor` version was requested):

```json
{
  "dependencies": {
    "foo": "workspace:*",
    "bar": "workspace:~",
    "qar": "workspace:^",
    "zoo": "workspace:^1.6.0"
  }
}
```

> **Note** semver range with an operator (ie `workspace:>=2.0.0`) are also supported but will never be mutated.