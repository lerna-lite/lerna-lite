[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/watch?color=forest)](https://www.npmjs.com/package/@lerna-lite/watch)
[![npm](https://img.shields.io/npm/v/@lerna-lite/watch.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/watch)

# @lerna-lite/watch

## (`lerna watch`) - Watch command [optional] 👓

Watch for changes within packages and execute commands from the root of the repository, for example, trigger a rebuild of packages when any of its files change.

> **Note** the `watch` command also exists in the original [Lerna](https://github.com/lerna/lerna), however their implementation uses Nx (no surprises) to watch for file changes. Since we want to keep Lerna-Lite well... light, we opted to use [`Chokidar`](https://github.com/paulmillr/chokidar), it is used by millions of packages (even ViteJS uses it), so chances are that you already have it installed directly or indirectly. Even though Lerna and Lerna-Lite differs in their internal implementations, their usage are nearly identical (apart from the [Chokidar options](#chokidar-options) that we also provide).

---

## Installation

```sh
npm install @lerna-lite/watch -D

# then use it (see usage below), sure yeah why not
lerna watch
```

## Usage

```sh
$ lerna watch -- <command>
```

The values `$LERNA_PACKAGE_NAME` and `$LERNA_FILE_CHANGES` will be replaced with the package name, the file that changed respectively. If multiple file changes are detected, they will all be listed and separated by a whitespace (unless a custom file delimiter is provided).

> **Note** When using these environment variables in the shell, you will need to escape the dollar sign with a backslash (`\`). See the [examples](#examples) below.

### Examples

Watch all packages and echo the package name and the file that changed:

```sh
$ lerna watch -- echo \$LERNA_PACKAGE_NAME \$LERNA_FILE_CHANGES
```

Watch only packages "package-1", "package-3" and their dependencies:

```sh
$ lerna watch --scope "package-{1,3}" --include-dependencies -- echo \$LERNA_PACKAGE_NAME \$LERNA_FILE_CHANGES
```

Watch only package "package-4" and its dependents and run the `test` script for the package that changed:

```sh
$ lerna watch --scope="package-4" --include-dependents -- lerna run test --scope=\$LERNA_PACKAGE_NAME
```

Watch the `/src` folder of each package using the `--glob` option and run the `test` script for the package that changed:

```sh
$ lerna watch --glob=\"src\" -- lerna run test --scope=\$LERNA_PACKAGE_NAME
```

Since you can execute any arbitrary commands, you could use `pnpm run` instead of `lerna run` to run the tests, the glob pattern can help to limit the watch to target only spec files

```sh
$ lerna watch --glob=\"src/**/*.spec.ts\" -- pnpm -r --filter=\$LERNA_PACKAGE_NAME test
```

Watch for changes on "package-1" and its dependents and run the "build" script on the scoped package and its dependents:

```sh
# with lerna run
$ lerna watch --scope=package-1 --include-dependents -- lerna run build --stream --scope=\$LERNA_PACKAGE_NAME --include-dependents

# similarly with pnpm run
$ lerna watch --scope=package-1 --include-dependents -- pnpm run --stream --filter ...\$LERNA_PACKAGE_NAME build
```

Watch and stream two packages and run the "build" script when any files within the targeted packages changed:

```sh
$ lerna watch --scope={my-package-1,my-package-2} -- lerna run build --stream --scope=\$LERNA_PACKAGE_NAME
```

When using `npx`, the `-c` option must be used if also providing variables for substitution:

```sh
$ npx -c 'lerna watch -- echo \$LERNA_PACKAGE_NAME \$LERNA_FILE_CHANGES'
```

> **Note** environment variables on Windows platform need to be wrapped between two `%` (e.g. `%LERNA_PACKAGE_NAME%`), you could also install [cross-env](https://www.npmjs.com/package/cross-env) to be cross-platform.

```sh
# On Windows
"scripts": {
  "watch-files": "lerna watch -- echo \"Watch file %LERNA_FILE_CHANGES% in package %LERNA_PACKAGE_NAME%\""
}

# On Windows with cross-env (cross platform)
"scripts": {
  "watch-files": "lerna watch -- cross-env-shell echo \"Watch file $LERNA_FILE_CHANGES in package $LERNA_PACKAGE_NAME\""
}
```

## Options

`lerna watch` accepts all [filter flags](https://github.com/lerna-lite/lerna-lite/blob/main/packages/core/README.md#options). Filter flags can be used to select specific packages to watch. See the [examples](#examples) above.

- [`@lerna/watch`](#lernawatch)
  - [Usage](#usage)
  - [Options](#options)
    - [`--debounce`](#--debounce)
    - [`--file-delimiter`](#--file-delimiter)
    - [`--glob`](#--glob)
    - [`--ignored`](#--ignored)
    - [`--stream`](#--stream)
    - [`--no-bail`](#--no-bail)
    - [`--no-prefix`](#--no-prefix)
  - [Chokidar Options](#chokidar-options)
    - [`--atomic`](#--atomic)
    - [`--depth`](#--depth)
    - [`--disable-globbing`](#--disable-globbing)
    - [`--follow-symlinks`](#--follow-symlinks)
    - [`--ignore-initial`](#--ignore-initial)
    - [`--ignore-permission-errors`](#--ignore-permission-errors)
    - [`--interval`](#--interval)
    - [`--use-polling`](#--use-polling)
    - [The `awaitWriteFinish` option](#the-awaitWriteFinish-option) (these options will be prefixed with `awf`)
      - [`--awf-poll-interval`](#--awf-poll-interval)
      - [`--awf-stability-threshold`](#--awf-stability-threshold)

> **Note** to limit the number of files being watched, you might want to take a look at either [`--ignored`](#--ignored) and/or [`--glob`](#--glob) options. The `lerna watch` command skips `.git/`, `dist/` and `node_modules/` directories by default.

### `--debounce`
Defaults to `200` time to wait in milliseconds before collecting all file changes before emitting them into a single watch event. Basically this option is to provide enough time for `lerna watch` to collect all files that changed (within that period) and avoid emitting too many watch events since Chokidar has no such debounce feature. This option becomes quite important when you do code change that affects hundred of file changes at the same time, the default is 200 but you might need to adjust the delay by increasing its value (in comparison, many libraries use `500` debounce for a watch).

```sh
$ lerna watch --debounce=500 -- <command>
```

### `--file-delimiter`
Defaults to a whitespace, the delimiter that will be used to separate files when mutiple file changes are emitted into a single event emitted by the watch via the $LERNA_FILE_CHANGES variable.

```sh
# use a different delimiter when multiple files are displayed
$ lerna watch --file-delimiter=\";;\" -- <command>
```

### `--glob`

Provide a Glob pattern to target specifically which files/paths to watch, note that this will be appended to the package file path that will be provided to the watch. For example, if our package is located under `/home/user/monorepo/packages/pkg-1` and we define a `"glob": "/src/**/*.{ts,tsx}"`, it will provide the following pattern  `/home/user/monorepo/packages/pkg-1/src/**/*.{ts,tsx}` to Chokidar watch.

```sh
# glob pattern will be appended to package path that Chokidar watches
$ lerna watch --glob=\"src\**\*.ts" -- <command>
```

### `--ignored`

Define files/paths to be ignored, it could be defined as a string, array of strings or Glob pattern ([anymatch](https://github.com/micromatch/anymatch)-compatible definition). Also, since this is used in a monorepo setup, we already preconfigured the watch to ignore `.git/`, `dist/` and `node_modules/` directories by default.

```sh
# ignore bin folder
$ lerna watch --ignored=\"**/bin\" -- <command>

# ignore dot file
$ lerna watch --ignored=\"/(^|[/\\])\../\" -- <command>
```

> **Note** the `lerna watch` command skips `.git/`, `dist/` and `node_modules/` directories by default. If you want to watch files inside any of these directories, you can pass a negated glob pattern, that is `lerna watch --ignored=\"!**/node_modules/**\"`

> [!NOTE]
> The `ignored` option only accept glob pattern (string or array of strings) and we then use [`tinyglobby`](https://www.npmjs.com/package/tinyglobby) internally to find out which files to watch. Please also note that this option is no longer the same as Chokidar@4 `ignored` option because their implementation no longer accept globs anymore but Lerna-Lite watch does.

### `--stream`

Stream output from child processes immediately, prefixed with the originating
package name. This allows output from different packages to be interleaved.

```sh
$ lerna watch --stream -- <command>
```

### `--no-bail`

```sh
# Run a command, ignoring non-zero (error) exit codes
$ lerna watch --no-bail -- <command>
```

By default, `lerna watch` will exit with an error if _any_ execution returns a non-zero exit code.
Pass `--no-bail` to disable this behavior, executing in _all_ packages regardless of exit code.

### `--no-prefix`

Disable package name prefixing when output is streaming (`--stream` _or_ `--parallel`).
This option can be useful when piping results to other processes, such as editor plugins.

## Chokidar Options
Most [`Chokidar`](https://github.com/paulmillr/chokidar) options are available and exposed (except `cwd` which is required internally). The option descriptions below are summarized, refer to the Chokidar [options](https://github.com/paulmillr/chokidar#api) website for more detailed informations.

### `--atomic`

Default to `true`, if `useFsEvents` and `usePolling` are `false`. Automatically filters out artifacts that occur when using editors that use "atomic writes" instead of writing directly to the source file.

```sh
$ lerna watch --atomic -- <command>
```

### `--depth`

Default to `undefined`, if set, limits how many levels of subdirectories will be traversed.

```sh
$ lerna watch --depth=99 -- <command>
```

### `--disable-globbing`

Defaults to `false`, if set to `true` then the strings passed to Chokidar `.watch()` and `.add()` are treated as literal path names, even if they look like globs.

```sh
$ lerna watch --disable-globbing -- <command>
```

> **Note** when this flag is enabled, it would cancel the [`--glob`](#--glob) option.

### `--follow-symlinks`

Defaults to `true`, when `false` is provided, only the symlinks themselves will be watched for changes instead of following the link references and bubbling events through the link's path.

```sh
$ lerna watch --follow-symlinks -- <command>
```

### `--ignore-initial`

Defaults to `true`, if set to false then `add`/`addDir` events are also emitted for matching paths while instantiating the watching as chokidar discovers these file paths (before the `ready` event).

```sh
$ lerna watch --ignore-initial -- <command>
```

### `--ignore-permission-errors`

Defaults to `true`, indicates whether to watch files that don't have read permissions if possible.

```sh
$ lerna watch --ignore-permission-errors -- <command>
```

### `--interval`

Defaults to `100`, interval of file system polling, in milliseconds. You may also set the CHOKIDAR_INTERVAL env variable to override this option.

```sh
$ lerna watch --interval=100 -- <command>
```

### `--use-polling`

Defaults to `false`, whether to use `fs.watchFile` (backed by polling), or `fs.watch`. If polling leads to high CPU utilization, consider setting this to `false`.

```sh
$ lerna watch --use-polling -- <command>
```

### The `awaitWriteFinish` option

The `awaitWriteFinish` option can be boolean or a complex object

> **Note** Providing a complex object is however difficult to pass to a CLI. So in order to make them accessible to the CLI, we prefixed them with "awf", the system will internally replace the option(s) with the appropriate Chokidar complex object. For example, `awfPollInterval: 200` will be transformed to `{ awaitWriteFinish: { pollInterval: 200 }}`

### `--await-write-finish`
#### boolean value
Defaults to `false`, by default the add event will fire when a file first appears on disk, before the entire file has been written. Setting `awaitWriteFinish` to true (or a truthy value) will poll file size, holding its `add` and `change` events until the size does not change for a configurable amount of time.

```sh
$ lerna watch --await-write-finish -- <command>
```

### `--awf-poll-interval`

Default to `100`, file size polling interval, in milliseconds.

```sh
$ lerna watch --awf-poll-interval=100 -- <command>
```

### `--awf-stability-threshold`

Default to `2000`, amount of time in milliseconds for a file size to remain constant before emitting its event.

```sh
$ lerna watch --awf-stability-threshold=2000 -- <command>
```

## Watch Environment Variables

Lerna-Lite will set 3 separate environment variables when running the inner command. These can be used to customize the command that will be executed.

- `$LERNA_PACKAGE_NAME` will be replaced with the name of the package that changed.
- `$LERNA_FILE_CHANGES` will be replaced with the file(s) that changed, separated by whitespace when multiple files are changed.

> **Note** When using these variables in the shell, you will need to escape the `$` with a backslash (`\`). See all examples above.

## Running With Package Managers

The examples above showcase using `lerna` directly in the terminal. However, you could also use `lerna` via a package manager without adding it to your path:

pnpm:

```sh
pnpm exec lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

yarn:

```sh
yarn lerna -- watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

npx:

```sh
npx -c 'lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME'
```

> **Note** When using `npx`, you will need to use `-c` and surround the entire `lerna watch` command in single quotes (`'`). Without this, `npx` will try to replace the watch environment variables before passing the command to `lerna`, resulting in an always empty value for `$LERNA_PACKAGE_NAME` and `$LERNA_FILE_CHANGES`.
