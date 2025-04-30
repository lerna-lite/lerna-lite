[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/publish?color=forest)](https://www.npmjs.com/package/@lerna-lite/publish)
[![npm](https://img.shields.io/npm/v/@lerna-lite/publish.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/@lerna-lite/publish)

# @lerna-lite/publish

## (`lerna publish`) - Publish command [optional] ☁️

Lerna-Lite Publish command, publish package(s) in the current project

---

## Installation

```sh
npm install @lerna-lite/publish -D

# then use it (see usage below)
lerna publish
```

## Usage

```sh
lerna publish               # publish packages that have changed since the last release
lerna publish from-git      # explicitly publish packages tagged in the current commit
lerna publish from-package  # explicitly publish packages where the latest version is not present in the registry
```

When run, this command does one of the following things:

- Publish packages updated since the last release (calling [`lerna version`](https://github.com/lerna-lite/lerna-lite/blob/main/packages/version/README.md) behind the scenes).
  - This is the legacy behavior of lerna 2.x.
  - The package updated since the last release will be found based on the `describeTag` pattern (For details, refer to [`lerna version`](https://github.com/lerna-lite/lerna-lite/blob/main/packages/version/README.md#--describe-tag-pattern)).
- Publish packages tagged in the current commit (`from-git`).
- Publish packages in the latest commit where the version is not present in the registry (`from-package`).
- Publish an unversioned "canary" release of packages (and their dependents) updated in the previous commit.

During all publish operations, appropriate [lifecycle scripts](#lifecycle-scripts) are called in the root and per-package (unless disabled by [`--ignore-scripts`](#--ignore-scripts)).

Check out [Per-Package Configuration](#per-package-configuration) for more details about publishing scoped packages, custom registries, and custom dist-tags.

> Note: See the [FAQ](#recovering-from-a-network-error) for information on how to recover from a failed publish.

## Important Notes

- Lerna will not publish packages which are marked as private (`"private": true` in the `package.json`). This is consistent with the behavior of `npm publish`. See the [package.json docs](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#private) for more information. To override this behavior, see the [`--include-private` option](#--include-private).

- Lerna _always_ uses `npm` to publish packages. If you use a package manager other than `npm`, you will need to still add the appropriate publishing configuration to `.npmrc`, even if `npmClient` is set to something other than `npm` in `lerna.json`.

## Positionals

### semver `--bump from-git`

In addition to the semver keywords supported by [`lerna version`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#positionals),
`lerna publish` also supports the `from-git` keyword.
This will identify packages tagged by `lerna version` and publish them to npm.
This is useful in CI scenarios where you wish to manually increment versions,
but have the package contents themselves consistently published by an automated process.

### semver `--bump from-package`

Similar to the `from-git` keyword except the list of packages to publish is determined by inspecting each `package.json`
and determining if any package version is not present in the registry. Any versions not present in the registry will
be published.
This is useful when a previous `lerna publish` failed to publish all packages to the registry.

## Options

`lerna publish` supports all of the options provided by [`lerna version`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#options) in addition to the options shown below, it also accepts all [filter flags](https://github.com/lerna-lite/lerna-lite/blob/main/packages/core/README.md#options).

```sh
$ lerna publish --scope my-component test
```

- [`@lerna/publish`](#lernapublish)
  - [Positionals](#positionals)
    - [semver `--bump from-git`](#semver---bump-from-git)
    - [semver `--bump from-package`](#semver---bump-from-package)
  - [Options](#options)
    - [`--arborist-load-options`](#--arborist-load-options)
    - [`--canary`](#--canary)
    - [`--cleanup-temp-files`](#--cleanup-temp-files)
    - [`--contents <dir>`](#--contents-dir)
    - [`--dist-tag <tag>`](#--dist-tag-tag)
    - [`--force-publish`](#--force-publish)
    - [`--git-head <sha>`](#--git-head-sha)
    - [`--graph-type <all|dependencies>`](#--graph-type-alldependencies)
    - [`--ignore-scripts`](#--ignore-scripts)
    - [`--ignore-prepublish`](#--ignore-prepublish)
    - [`--legacy-auth`](#--legacy-auth)
    - [`--no-git-reset`](#--no-git-reset)
    - [`--no-granular-pathspec`](#--no-granular-pathspec)
    - [`--otp`](#--otp)
    - [`--preid`](#--preid)
    - [`--pre-dist-tag <tag>`](#--pre-dist-tag-tag)
    - [`--remove-package-fields <fields>`](#--remove-package-fields-fields)
    - [`--registry <url>`](#--registry-url)
    - [`--tag-version-prefix`](#--tag-version-prefix)
    - [`--temp-tag`](#--temp-tag)
    - [`--throttle`](#--throttle)
    - [`--summary-file <dir>`](#--summary-file)
    - [`--verify-access`](#--verify-access)
    - [`--yes`](#--yes)
  - [`publishConfig` Overrides](#publishconfig-overrides)
  - [`catalog:` protocol](#catalog-protocol)
  - [`workspace:` protocol](#workspace-protocol)

### `--arborist-load-options`
Arborist options that can be provided in your `lerna.json` config which are options associated to the `arborist.loadActual(options)` method. This option exists because in some rare occasions Arborist could be extremely slow to parse the entire tree from a project repository. The slowness was found to be caused by Arborist and a potential way to speedup the process is to ignore the missing edges when parsing the tree (which is the config example shown below). It was provided as an opt-in option because we don't know if ignoring missing edges has any negative side effect (we think it's ok but still, to be safe we've made it as opt-in with below option)

Only configurable via `lerna.json` since an object type must be provided:

```json
{
  "command": {
    "publish": {
      "arboristLoadOptions": { "ignoreMissing": true }
    }
  }
}
```

### `--canary`

```sh
lerna publish --canary
# 1.0.0 => 1.0.1-alpha.0.${SHA} of packages changed since the previous commit
# a subsequent canary publish will yield 1.0.1-alpha.1.${SHA}, etc

lerna publish --canary --preid beta
# 1.0.0 => 1.0.1-beta.0.${SHA}

# The following are equivalent:
lerna publish --canary minor
lerna publish --canary preminor
# 1.0.0 => 1.1.0-alpha.0.${SHA}
```

When run with this flag, `lerna publish` publishes packages in a more granular way (per commit).
Before publishing to npm, it creates the new `version` tag by taking the current `version`, bumping it to the next _minor_ version, adding the provided meta suffix (defaults to `alpha`) and appending the current git sha (ex: `1.0.0` becomes `1.1.0-alpha.0+81e3b443`).

If you have publish canary releases from multiple active development branches in CI,
it is recommended to customize the [`--preid`](#--preid) and [`--dist-tag <tag>`](#--dist-tag-tag) on a per-branch basis to avoid clashing versions.

> The intended use case for this flag is a per commit level release or nightly release.

Canary releases cannot be used in conjunction with the `--build-metadata` option.

### `--cleanup-temp-files`

Cleanup the temp folders used by the publish process once the execution is over, defaults to `false`.

```sh
lerna publish --cleanup-temp-files
```

> **Note** Lerna-Lite is prefixing the temp folders containing each package tarball with "lerna-", we then use a glob pattern to delete every folders starting with this prefix. Also note that it is entirely possible that this cleanup misses some extra temp files created by the publish process.

### `--contents <dir>`

Subdirectory to publish. Must apply to ALL packages, and MUST contain a package.json file.
Package lifecycles will still be run in the original leaf directory.
You should probably use one of those lifecycles (`prepare`, `prepublishOnly`, or `prepack`) to _create_ the subdirectory and whatnot.

If you're into unnecessarily complicated publishing, this will give you joy.

```sh
lerna publish --contents dist
# publish the "dist" subfolder of every lerna-managed leaf package
```

**NOTE:** You should wait until the `postpublish` lifecycle phase (root or leaf) to clean up this generated subdirectory,
as the generated package.json is used during package upload (_after_ `postpack`).

### `--dist-tag <tag>`

```sh
lerna publish --dist-tag next
```

When run with this flag, `lerna publish` will publish to npm with the given npm [dist-tag](https://docs.npmjs.com/cli/v8/commands/npm-dist-tag) (defaults to `latest`).

This option can be used to publish a [`prerelease`](http://carrot.is/coding/npm_prerelease) or `beta` version under a non-`latest` dist-tag, helping consumers avoid automatically upgrading to prerelease-quality code.

> Note: the `latest` tag is the one that is used when a user runs `npm install my-package`.
> To install a different tag, a user can run `npm install my-package@prerelease`.

### `--force-publish`

To be used with [`--canary`](#--canary) to publish a canary version of all packages in your monorepo. This flag can be helpful when you need to make canary releases of packages beyond what was changed in the most recent commit.

```sh
lerna publish --canary --force-publish
```

### `--git-head <sha>`

Explicit SHA to set as [`gitHead`](https://github.com/npm/read-package-json/blob/67f2d8d501e2621441a8235b08d589fbeeb7dba6/read-json.js#L327) on manifests when packing tarballs, only allowed with [`from-package`](#bump-from-package) positional.

For example, when publishing from AWS CodeBuild (where `git` is not available),
you could use this option to pass the appropriate [environment variable](https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-env-vars.html) to use for this package metadata:

```sh
lerna publish from-package --git-head ${CODEBUILD_RESOLVED_SOURCE_VERSION}
```

Under all other circumstances, this value is derived from a local `git` command.

### `--graph-type <all|dependencies>`

Set which kind of dependencies to use when building a package graph. The default value is `dependencies`, whereby only packages listed in the `dependencies` section of a package's `package.json` are included. Pass `all` to include both `dependencies` _and_ `devDependencies` when constructing the package graph and determining topological order.

When using traditional peer + dev dependency pairs, this option should be configured to `all` so the peers are always published before their dependents.

```sh
lerna publish --graph-type all
```

Configured via `lerna.json`:

```json
{
  "command": {
    "publish": {
      "graphType": "all"
    }
  }
}
```

### `--ignore-scripts`

When passed, this flag will disable running [lifecycle scripts](#lifecycle-scripts) during `lerna publish`.

### `--ignore-prepublish`

When passed, this flag will disable running [deprecated](https://docs.npmjs.com/misc/scripts#prepublish-and-prepare) [`prepublish` scripts](#lifecycle-scripts) during `lerna publish`.

### `--legacy-auth`

When publishing packages that require authentication but you are working with an internally hosted NPM Registry that only uses the legacy Base64 version of username:password. This is the same as the NPM publish `_auth` flag.

```sh
lerna publish --legacy-auth aGk6bW9t
```

### `--no-git-reset`

By default, `lerna publish` ensures any changes to the working tree have been reset.

To avoid this, pass `--no-git-reset`. This can be especially useful when used as part of a CI pipeline in conjunction with the `--canary` flag. For instance, the `package.json` version numbers which have been bumped may need to be used in subsequent CI pipeline steps (such as Docker builds).

```sh
lerna publish --no-git-reset
```

### `--no-granular-pathspec`

By default, `lerna publish` will attempt (if enabled) to `git checkout` _only_ the leaf package manifests that are temporarily modified during the publishing process. This yields the equivalent of `git checkout -- packages/*/package.json`, but tailored to _exactly_ what changed.

If you **know** you need different behavior, you'll understand: Pass `--no-granular-pathspec` to make the git command _literally_ `git checkout -- .`. By opting into this [pathspec](https://git-scm.com/docs/gitglossary#Documentation/gitglossary.txt-aiddefpathspecapathspec), you must have all intentionally unversioned content properly ignored.

This option makes the most sense configured in `lerna.json`, as you really don't want to mess it up:

```json
{
  "version": "independent",
  "granularPathspec": false
}
```

The root-level configuration is intentional, as this also covers the [identically-named option in `lerna version`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--no-granular-pathspec).

### `--otp`

When publishing packages that require two-factor authentication, you can specify a [one-time password](https://docs.npmjs.com/about-two-factor-authentication) using `--otp`:

```sh
lerna publish --otp 123456
```

> Please keep in mind that one-time passwords expire within 30 seconds of their generation. If it expires during publish operations, a prompt will request a refreshed value before continuing.

### `--preid`

Unlike the `lerna version` option of the same name, this option only applies to [`--canary`](#--canary) version calculation.

```sh
lerna publish --canary
# uses the next semantic prerelease version, e.g.
# 1.0.0 => 1.0.1-alpha.0

lerna publish --canary --preid next
# uses the next semantic prerelease version with a specific prerelease identifier, e.g.
# 1.0.0 => 1.0.1-next.0
```

When run with this flag, `lerna publish --canary` will increment `premajor`, `preminor`, `prepatch`, or `prerelease` semver
bumps using the specified [prerelease identifier](http://semver.org/#spec-item-9).

### `--pre-dist-tag <tag>`

```sh
lerna publish --pre-dist-tag next
```

Works the same as [`--dist-tag`](#--dist-tag-tag), except only applies to packages being released with a prerelease version.

### `--remove-package-fields <fields>`

Remove certain fields from every package before publishing them to the registry, we can also remove fields from a complex object structure via the dot notation (ie "scripts.build"). In summary this option is helpful in cleaning each "package.json" of every packages, it allows us to remove any extra fields that do not have any usage outside of the project itself (for example "devDependencies", "scripts", ...).

```sh
# remove "devDepencies" and "scripts" fields from all packages
lerna version --remove-package-fields 'devDependencies' 'scripts'
```

> **Note** lifecycle scripts (`prepublish`, `prepublishOnly`, `prepack`, `postpack`) are executed after the field removal process and for that reason if any of these scripts are found, it will leave them in place and skip the removal whenever found.

> **Note** this option will actually temporarily modify the actual `package.json` just before the publish process starts and will then revert the change after the publish process is completed. If for whatever reason, your publish process fails, it is possible that your each package, are now in an invalid state (e.g. `scripts` could be removed), so it very important to review your `package.json` after a publish failure.

Removal of complex object value(s) are also supported via the dot notation as shown below.

```sh
lerna version --remove-package-fields 'scripts.build'
```

##### output

```diff
{
  script: {
-   "build": "tsc --project tsconfig.json",
    "build:dev": "tsc --incremental --watch"
  }
}
```

This option is probably best specified in `lerna.json` configuration

```json
{
  "command": {
    "publish": {
      "removePackageFields": ["devDependencies", "scripts"]
    }
  }
}
```

### `--registry <url>`

When run with this flag, forwarded npm commands will use the specified registry for your package(s).

This is useful if you do not want to explicitly set up your registry
configuration in all of your package.json files individually when e.g. using
private registries.

### `--tag-version-prefix`

This option allows to provide custom prefix instead of the default one: `v`.

Keep in mind, if splitting `lerna version` and `lerna publish`, you need to pass it to both commands:

```bash
# locally
lerna version --tag-version-prefix=''

# on ci
lerna publish from-git --tag-version-prefix=''
```

You could also configure this at the root level of `lerna.json`, applying to both commands equally:

```json
{
  "tagVersionPrefix": "",
  "packages": ["packages/*"],
  "version": "independent"
}
```

### `--temp-tag`

When passed, this flag will alter the default publish process by first publishing
all changed packages to a temporary dist-tag (`lerna-temp`) and then moving the
new version(s) to the dist-tag configured by [`--dist-tag`](#--dist-tag-tag) (default `latest`).

This is not generally necessary, as lerna will publish packages in topological
order (all dependencies before dependents) by default.

### `--summary-file`

```sh
# Will create a summary file in the root directory, i.e. `./lerna-publish-summary.json`
lerna publish --canary --yes --summary-file
# Will create a summary file in the provided directory, i.e. `./some/other/dir/lerna-publish-summary.json`
lerna publish --canary --yes --summary-file ./some/other/dir
# Will create a summary file with the provided name, i.e. `./some/other/dir/my-summary.json`
lerna publish --canary --yes --summary-file ./some/other/dir/my-summary.json
```

When run with this flag, a json summary report will be generated after all packages have been successfully published (see below for an example).

```json
[
  {
    "packageName": "package1",
    "version": "v1.0.1-alpha"
  },
  {
    "packageName": "package2",
    "version": "v2.0.1-alpha"
  }
]
```

### `--verify-access`

Historically, `lerna` attempted to fast-fail on authorization/authentication issues by performing some preemptive npm API requests using the given token. These days, however, there are multiple types of tokens that npm supports and they have varying levels of access rights, so there is no one-size fits all solution for this preemptive check and it is more appropriate to allow requests to npm to simply fail with appropriate errors for the given token. For this reason, the legacy `--verify-access` behavior is disabled by default and will likely be removed in a future major version.

For now, though, if you pass this flag you can opt into the legacy behavior and `lerna` will preemptively perform this verification before it attempts to publish any packages.

You should NOT use this option if:

1.  You are using a third-party registry that does not support `npm access ls-packages`
2.  You are using an authentication token without read access, such as a [npm automation access token](https://docs.npmjs.com/creating-and-viewing-access-tokens#creating-access-tokens)

### `--throttle`

This option class allows to throttle the timing at which modules are published to the configured registry.

- `--throttle`: Enable throttling when publishing modules
- `--throttle-size`: The amount of modules that may be published at once (defaults to `25`)
- `--throttle-delay`: How long to wait after a module was successfully published (defaults to 30 seconds)

This is usefull to avoid errors/retries when publishing to rate-limited repositories on huge monorepos:

```bash
lerna publish from-git --throttle --throttle-delay=$((3600*24))
```

### `--yes`

```sh
lerna publish --canary --yes
# skips `Are you sure you want to publish the above changes?`
```

When run with this flag, `lerna publish` will skip all confirmation prompts.
Useful in [Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) to automatically answer the publish confirmation prompt.

## Per-Package Configuration

A leaf package can be configured with special [`publishConfig`](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#publishconfig) that in _certain_ circumstances changes the behavior of `lerna publish`.

### `publishConfig.access`

To publish packages with a scope (e.g., `@mycompany/rocks`), you must set [`access`](https://docs.npmjs.com/cli/v8/using-npm/config#access):

```json
  "publishConfig": {
    "access": "public"
  }
```

- If this field is set for a package _without_ a scope, it **will** fail.
- If you _want_ your scoped package to remain private (i.e., `"restricted"`), there is no need to set this value.

  Note that this is **not** the same as setting `"private": true` in a leaf package; if the `private` field is set, that package will _never_ be published under any circumstances.

### `publishConfig.registry`

You can customize the registry on a per-package basis by setting [`registry`](https://docs.npmjs.com/cli/v8/using-npm/config#registry):

```json
  "publishConfig": {
    "registry": "http://my-awesome-registry.com/"
  }
```

- Passing [`--registry`](#--registry-url) applies globally, and in some cases isn't what you want.

### `publishConfig.tag`

You can customize the dist-tag on a per-package basis by setting [`tag`](https://docs.npmjs.com/cli/v8/using-npm/config#tag):

```json
  "publishConfig": {
    "tag": "flippin-sweet"
  }
```

- Passing [`--dist-tag`](#--dist-tag-tag) will _overwrite_ this value.
- This value is _always_ ignored when [`--canary`](#--canary) is passed.

### `publishConfig.directory`

This _non-standard_ field allows you to customize the published subdirectory just like [`--contents`](#--contents-dir), but on a per-package basis. All other caveats of `--contents` still apply.

```json
  "publishConfig": {
    "directory": "dist"
  }
```

## `publishConfig` Overrides
Certain fields defined in `publishConfig` can be used to override other fields in the manifest before the package gets published. As per pnpm [`publishConfig`](https://pnpm.io/package_json#publishconfig) documentation, you can override any of these fields:

- `bin`, `browser`, `cpu`, `esnext`, `es2015`, `exports`, `imports`, `libc`, `main`, `module`, `os`, `type`, `types`, `typings`, `typesVersions`, `umd:main`, `unpkg`

> **Note** the code implementation was copied from pnpm but it is totally agnostic and will work the same way for all package manager (pnpm, yarn or npm).

> **Note** this option is enabled by default but can be disabled via `lerna publish --no-publish-config-overrides` or (`"publishConfigOverrides": false` in `lerna.json`)

For instance, the following `package.json` (with pnpm, yarn or npm):

```json
{
    "name": "foo",
    "version": "1.0.0",
    "main": "src/index.ts",
    "publishConfig": {
        "main": "lib/index.js",
        "typings": "lib/index.d.ts"
    }
}
```

Will be published as:

```json
{
    "name": "foo",
    "version": "1.0.0",
    "main": "lib/index.js",
    "typings": "lib/index.d.ts"
}
```

<a id="lifecycle-events"><!-- back-compat with previous heading --></a>

## Lifecycle Scripts

```js
// prepublish:      Run BEFORE the package is packed and published.
// prepare:         Run BEFORE the package is packed and published, AFTER prepublish, BEFORE prepublishOnly.
// prepublishOnly:  Run BEFORE the package is packed and published, ONLY on npm publish.
// prepack:         Run BEFORE a tarball is packed.
// postpack:        Run AFTER the tarball has been generated and moved to its final destination.
// publish:         Run AFTER the package is published.
// postpublish:     Run AFTER the package is published.
```

lerna will run [npm lifecycle scripts](https://docs.npmjs.com/cli/v8/using-npm/scripts#description) during `lerna publish` in the following order:

1. If versioning implicitly, run all [version lifecycle scripts](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#lifecycle-scripts)
2. Run `prepublish` lifecycle in root, if [enabled](#--ignore-prepublish)
3. Run `prepare` lifecycle in root
4. Run `prepublishOnly` lifecycle in root
5. Run `prepack` lifecycle in root
6. For each changed package, in topological order (all dependencies before dependents):
   1. Run `prepublish` lifecycle, if [enabled](#--ignore-prepublish)
   2. Run `prepare` lifecycle
   3. Run `prepublishOnly` lifecycle
   4. Run `prepack` lifecycle
   5. Create package tarball in temp directory via [JS API](https://github.com/lerna-lite/lerna-lite/blob/main/packages/publish/src/lib/pack-directory.ts)
   6. Run `postpack` lifecycle
7. Run `postpack` lifecycle in root
8. For each changed package, in topological order (all dependencies before dependents):
   1. Publish package to configured [registry](#--registry-url) via [JS API](https://github.com/lerna-lite/lerna-lite/blob/main/packages/publish/src/lib/npm-publish.ts)
   2. Run `publish` lifecycle
   3. Run `postpublish` lifecycle
9. Run `publish` lifecycle in root
   - To avoid recursive calls, don't use this root lifecycle to run `lerna publish`
10. Run `postpublish` lifecycle in root
11. Update temporary dist-tag to latest, if [enabled](#--temp-tag)

# `catalog:` protocol

The `catalog:` protocol ([pnpm catalog](https://pnpm.io/catalogs)) can be recognized by Lerna-Lite. When publishing, they will be replaced "as is" by reading and using the version range defined in your global catalog. If you need to bump the version of a package in a catalog, you will need to edit `pnpm-workspace.yaml` manually. If you wish them to be bumped automatically, then we strongly suggest that you use the [`workspace:`](#workspace-protocol) protocol instead which is better for local workspace dependencies.

> [!NOTE]
> Lerna-Lite will only ever read the catalog, from `pnpm-workspace.yaml` to get dependency versions, but it will **never write** to the catalog. If you want version bump then you should use `workspace:` for local dependencies. It does work with local dependencies but only if the dependency version changed in a previous commit before lerna version/publish are executed, since again Lerna-Lite will never write or update the catalog.

So for example, if our `pnpm-workspace.yaml` file has the following configuration

```yaml
packages:
  - packages/*

# Define a catalog of version ranges.
catalog:
  fs-extra: '^11.2.0'
  typescript: '^5.7.0'

# named catalogs are also supported
catalogs:
  # Can be referenced through "catalog:react17" or "catalog:react18"
  react17:
    react: ^17.0.0
    react-dom: ^17.0.0
  react18:
    react: ^18.2.0
    react-dom: ^18.2.0
```

and then if one of our package has the following dependencies defined in our `package.json`

```json
{
  "dependencies": {
    "fs-extra": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:"
  },
  "peerDependencies": {
    "react": "catalog:react18",
    "react-dom": "catalog:react18"
  }
}
```

#### versions that will be published

Lerna-Lite will resolve all `catalog:` protocol by extracting the version ranges defined in the global catalog(s) and will publish the following:

```json
{
  "dependencies": {
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

# `workspace:` protocol

The `workspace:` protocol ([pnpm workspace](https://pnpm.io/workspaces), [yarn workspace](https://yarnpkg.com/features/workspaces#workspace-ranges-workspace)) is also supported by Lerna-Lite. You could also use this in combo with the new [`--sync-workspace-lock`](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#--sync-workspace-lock) flag to properly update your root project lock file. When publishing, it will replace any `workspace:` dependencies by:

- the corresponding version in the target workspace (if you use `workspace:*`, `workspace:~`, or `workspace:^`)
- the associated semver range (for any other range type)

So for example, if we have `foo`, `bar`, `qar`, `zoo` in the workspace and they all are at version `1.5.0` (before publishing), the following:

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

> **Note** semver range with an operator (ie `workspace:>=2.0.0`) are also supported but will never be mutated.

#### versions that will be published

The library is doing a strict match and it will transform and publish the following:

```json
{
  "dependencies": {
    "foo": "1.5.0",
    "bar": "~1.5.0",
    "qar": "^1.5.0",
    "zoo": "^1.5.0"
  }
}
```

> **Note** semver range with an operator (ie `workspace:>=2.0.0`) are also supported but will never be mutated.

## FAQ

### Recovering from a network error

In the case that some packages were successfully published and others were not, `lerna publish` may have left the repository in an inconsistent state with some changed files. To recover from this, reset any extraneous local changes from the failed run to get back to a clean working tree. Then, retry the same `lerna publish` command. Lerna will attempt to publish all of the packages again, but will recognize those that have already been published and skip over them with a warning.

If you used the `lerna publish` command without positional arguments to select a new version for the packages, then you can run `lerna publish from-git` to retry publishing that same already-tagged version instead of having to bump the version again while retrying.
