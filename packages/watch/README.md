[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/watch?color=forest)](https://www.npmjs.com/package/@lerna-lite/watch)
[![npm](https://img.shields.io/npm/v/@lerna-lite/watch.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/watch)

# @lerna-lite/watch

## (`lerna watch`) - Watch command [optional] 👓

Watch for changes within packages and execute commands from the root of the repository, for example when TypeScript or SASS files changed.

> **Note** the `watch` command also exists in Lerna but their implementation is using Nx (no surprises here) to watch file changes but Nx is a rather large dependency. However in Lerna-Lite we opted to use a smaller package [`chokidar`](https://github.com/paulmillr/chokidar). Chokidar is used by millions of packages (TypeScript, SASS, ... even VSCode uses it), so chances are that you already have it installed directly or indirectly. Most of Chokidar [options](https://github.com/paulmillr/chokidar#api) are also available with the `lerna watch` command, see the [Chokidar options](#chokidar-options) below.

> **Note** Chokidar fires an event for each file that changed, that is even when multiple files are saved at the same time. If anyone knows or to circumvent this problem and firing only a single event instead of multiple, please reach out in a [Discussion](https://github.com/lerna-lite/lerna-lite/discussions).

---

## Installation

```sh
npm install @lerna-lite/watch -D -W

# then use it (see usage below), sure yeah why not
lerna watch

# OR use npx
npx lerna watch
```

## Usage

```sh
$ lerna watch -- <command>
```

The values `$LERNA_PACKAGE_NAME`, `LERNA_WATCH_CHANGE_FILE` and `LERNA_WATCH_CHANGE_TYPE` will be replaced with the package name, the file that changed and the fired event respectively. If multiple file changes are detected, it will fire multiple events (one event per file changed).

> **Note** When using `$LERNA_PACKAGE_NAME` and `LERNA_WATCH_CHANGE_FILE` in the shell, you will need to escape the dollar sign with a backslash (`\`) when used in the shell. See the [examples](#examples) below.

### Examples

Watch all packages and echo the package name and the file that changed:

```sh
$ lerna watch -- echo \$LERNA_PACKAGE_NAME \LERNA_WATCH_CHANGE_FILE
```

Watch only packages "package-1", "package-3" and their dependencies:

```sh
$ lerna watch --scope "package-{1,3}" --include-dependencies -- echo \$LERNA_PACKAGE_NAME \LERNA_WATCH_CHANGE_FILE
```

Watch only package "package-4" and its dependencies and run the `test` script for the package that changed:

```sh
$ lerna watch --scope="package-4" --include-dependencies -- lerna run test --scope=\$LERNA_PACKAGE_NAME
```

Watch a single package and run the "build" script on it when a file within it changes:

```sh
$ lerna watch --scope="my-package-1" -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

When using `npx`, the `-c` option must be used if also providing variables for substitution:

```sh
$ npx -c 'lerna watch -- echo \$LERNA_PACKAGE_NAME \LERNA_WATCH_CHANGE_FILE'
```

> **Note** environment variables on Windows platform needs to be wrapped in `%` symbol (ie `%LERNA_PACKAGE_NAME%`), to circumvent this problem and be cross platform, you could install [`cross-env`](https://www.npmjs.com/package/cross-env).

```sh
# On Windows
"scripts": {
  "watch-files": "lerna watch -- echo \"Watch file %LERNA_WATCH_CHANGE_FILE% %LERNA_WATCH_CHANGE_TYPE% in package %LERNA_PACKAGE_NAME%\""
}

# On Windows with cross-env
```sh
"scripts": {
  "watch-files": "cross-env-shell lerna watch -- echo \"Watch file $LERNA_WATCH_CHANGE_FILE $LERNA_WATCH_CHANGE_TYPE in package $LERNA_PACKAGE_NAME\""
}
```

## Options

`lerna watch` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options). Filter flags can be used to select specific packages to watch. See the [examples](#examples) above.

- [`@lerna/watch`](#lernawatch)
  - [Usage](#usage)
  - [Options](#options)
    - [`--glob`](#--glob)
    - [`--no-bail`](#--no-bail)
    - [`--watch-added-file`](#--watch-added-file)
    - [`--watch-removed-file`](#--watch-removed-file)
    - [`--watch-added-dir`](#--watch-added-dir)
    - [`--watch-removed-dir`](#--watch-removed-dir)
  - [Chokidar-Options](#chokidar-options)
    - [`--atomic`](#--atomic)
    - [`--depth`](#--depth)
    - [`--disable-globbing`](#--disable-globbing)
    - [`--follow-symlinks`](#--follow-symlinks)
    - [`--ignored`](#--ignored)
    - [`--ignore-permission-errors`](#--ignore-permission-errors)
    - [`--interval`](#--interval)
    - [`--use-polling`](#--use-polling)
    - `awaitWriteFinish` options will be prefixed with `awf`
      - [`--awf-poll-interval`](#--awf-poll-interval)
      - [`--awf-stability-threshold`](#--awf-stability-threshold)


### `--glob`

Glob pattern to define which files will be watched, note that this will be appended to the package file path being provided to Chokidar. For example if our package is located under `/home/user/monorepo/packages/pkg-1` and we define `"/src/**/*.{ts,tsx}"` as `glob`, then it will use this watch pattern in Chokidar `/home/user/monorepo/packages/pkg-1/src/**/*.{ts,tsx}`

```json
{
  "$schema": "node_modules/@lerna-lite/cli/schemas/lerna-schema.json",
  "command": {
    "watch": {
      "glob": "/src/**/*.{ts,tsx}"
    }
  }
}
```

```sh
# Run a build command when js or ts file changes
$ lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME <command>
```

### `--no-bail`

```sh
# Run a command, ignoring non-zero (error) exit codes
$ lerna watch --no-bail <command>
```

By default, `lerna watch` will exit with an error if _any_ execution returns a non-zero exit code.
Pass `--no-bail` to disable this behavior, executing in _all_ packages regardless of exit code.

### `--watch-added-file`

Defaults to false, when enabled it will fire when a file is being added.

```sh
$ lerna watch --watch-added-file <command>
```

### `--watch-added-dir`

Defaults to false, when enabled it will fire when a directory is being added.

```sh
$ lerna watch --watch-added-dir <command>
```

### `--watch-removed-file`

Defaults to false, when enabled it will fire when a file is being removed.

```sh
$ lerna watch --watch-removed-file <command>
```

### `--watch-removed-dir`

Defaults to false, when enabled it will fire when a directory is being removed.

```sh
$ lerna watch --watch-removed-dir <command>
```

> **Note** When enabling any of the extra watch events, you might need to know if the file or directory was being added or removed and for that you can use `$LERNA_WATCH_CHANGE_TYPE`. Also note that a file or directory removal is the event `unlink` and `unlinkDir`.

> **Note** Another thing to be aware is that `add`/`addDir` events are also emitted for matching paths while instantiating the watching as chokidar discovers these file paths (before the `ready` event). In other words, when this option is disabled it will fire an event for each file/directory that are discovered which is why we enabled `ignoreInitial` to avoid firing too many events while starting the watch.

## Chokidar options
Most Chokidar options are available and exposed, refer to Chokidar [options](https://github.com/paulmillr/chokidar#api) for more informations.

### `--atomic`

Default to true, if `useFsEvents` and `usePolling` are `false`. Automatically filters out artifacts that occur when using editors that use "atomic writes" instead of writing directly to the source file.

```sh
$ lerna watch --atomic <command>
```

### `--depth`

Default to `undefined`, if set, limits how many levels of subdirectories will be traversed.

```sh
$ lerna watch --depth <command>
```

### `--disable-globbing`

Defaults to false, if set to true then the strings passed to .watch() and .add() are treated as literal path names, even if they look like globs.

```sh
$ lerna watch --disable-globbing <command>
```

### `--follow-symlinks`

Defaults to true, when false, only the symlinks themselves will be watched for changes instead of following the link references and bubbling events through the link's path.

```sh
$ lerna watch --follow-symlinks <command>
```

### `--ignored`

Defines files/paths to be ignored.

```sh
$ lerna watch --ignored <command>
```

### `--ignore-permission-errors`

Defaults to false, indicates whether to watch files that don't have read permissions if possible.

```sh
$ lerna watch --ignore-permission-errors <command>
```

### `--interval`

Defaults to 100, interval of file system polling, in milliseconds. You may also set the CHOKIDAR_INTERVAL env variable to override this option.

```sh
$ lerna watch --interval <command>
```

### `--use-polling`

Defaults to false, whether to use fs.watchFile (backed by polling), or fs.watch. If polling leads to high CPU utilization, consider setting this to false.

```sh
$ lerna watch --use-polling <command>
```

> **Note** The `awaitWriteFinish` option can be a complex object but in order to provide these options from the CLI, we'll prefix them with "awf", and internally when these prefix are found, we'll build the appropriate complex object, ie: `awfPollInterval: 200` will be transformed to `{ awaitWriteFinish: { pollInterval: 200 }}`
### `--awf-poll-interval`

Default to 100, file size polling interval, in milliseconds.

```sh
$ lerna watch --awf-poll-interval <command>
```

### `--awf-stability-threshold`

Default to 2000, amount of time in milliseconds for a file size to remain constant before emitting its event.

```sh
$ lerna watch --awf-stability-threshold <command>
```

## Watch Environment Variables

Lerna will set 3 separate environment variables when running the inner command. These can be used to customize the command that is run.

- `$LERNA_PACKAGE_NAME` will be replaced with the name of the package that changed.
- `$LERNA_WATCH_CHANGE_FILE` will be replaced with the file that changed. Note that Chokidar fires an event for each file changed
- `$LERNA_WATCH_CHANGE_TYPE` will be replaced with the file the event that was fired.
   - defaults to `change`, other events could be `add`, `addDir`, `unlink` or `unlinkDir`

> **Note** When using these variables, you will need to escape the `$` with a backslash (`\`) when used in the shell. See the examples above.

## Running With Package Managers

The examples above showcase using `lerna` directly in the terminal. However, you can also use `lerna` via a package manager without adding it to your path:

pnpm:

```sh
pnpm lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

yarn:

```sh
yarn lerna -- watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME
```

npx:

```sh
npx -c 'lerna watch -- lerna run build --scope=\$LERNA_PACKAGE_NAME'
```

> **Note** When using `npx`, you will need to use `-c` and surround the entire `lerna watch` command in single quotes (`'`). Without this, `npx` will try to replace the watch environment variables before passing the command to `lerna`, resulting in an always empty value for `$LERNA_PACKAGE_NAME` and `$LERNA_WATCH_CHANGE_FILE`.