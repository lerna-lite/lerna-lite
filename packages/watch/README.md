[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/watch?color=forest)](https://www.npmjs.com/package/@lerna-lite/watch)
[![npm](https://img.shields.io/npm/v/@lerna-lite/watch.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/watch)

# @lerna-lite/watch

## (`lerna watch`) - Watch command [optional] 👓

Watch for changes within packages and execute commands from the root of the repository, for example trigger rebuilds of packages when their files changed.

> **Note** the `watch` command also exists in the original [Lerna](https://github.com/lerna/lerna), however their implementation uses Nx (no surprises) to watch for file changes. Since we want to keep Lerna-Lite well... light, we opted to use [`Chokidar`](https://github.com/paulmillr/chokidar), it is used by millions of packages (even ViteJS uses it), so chances are that you already have it installed directly or indirectly. Another bonus is that most of Chokidar [options](https://github.com/paulmillr/chokidar#api) are also available with the Lerna-Lite `watch` command, please refer to the [Chokidar options](#chokidar-options) below. Even though Lerna and Lerna-Lite differs in their internal implementations, their usage are quite similar (apart from the Chokidar options).

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

The values `$LERNA_PACKAGE_NAME`, `$LERNA_FILE_CHANGES` and `$LERNA_FILE_CHANGE_TYPE` will be replaced with the package name, the file that changed, and the [`Chokidar`](https://github.com/paulmillr/chokidar) event that was fired respectively. If multiple file changes are detected, they will all be listed and separated by a whitespace (unless custom file delimiter are provided).

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

Watch only package "package-4" and its dependencies and run the `test` script for the package that changed:

```sh
$ lerna watch --scope="package-4" --include-dependencies -- lerna run test --scope=\$LERNA_PACKAGE_NAME
```

Watch the `/src` folder for any event (add, remove, ...) of each package using the `--glob` option and run the `test` script for the package that changed:

```sh
$ lerna watch --glob=\"src\" --watch-all-events -- lerna run test --scope=\$LERNA_PACKAGE_NAME
```

Since you can execute any arbitrary commands, you could use `pnpm run` instead of `lerna run` to run the tests, the glob helps to limit the watch to only spec files

```sh
$ lerna watch --glob=\"src/**/*.spec.ts\" -- pnpm -r --filter=\$LERNA_PACKAGE_NAME test
```

Watch a single package and run the "build" script on it when a file within it changes (but ignore `dist` folder) and also stream the build output:

```sh
$ lerna watch --ignored=\"**/dist\", --scope="my-package-1" -- lerna run build --scope=\$LERNA_PACKAGE_NAME --stream
```

When using `npx`, the `-c` option must be used if also providing variables for substitution:

```sh
$ npx -c 'lerna watch -- echo \$LERNA_PACKAGE_NAME \$LERNA_FILE_CHANGES'
```

> **Note** environment variables on Windows platform need to be wrapped in `%` symbol (ie `%LERNA_PACKAGE_NAME%`), to be cross-platform you can install [cross-env](https://www.npmjs.com/package/cross-env).

```sh
# On Windows
"scripts": {
  "watch-files": "lerna watch -- echo \"Watch file %LERNA_FILE_CHANGES% %LERNA_FILE_CHANGE_TYPE% in package %LERNA_PACKAGE_NAME%\""
}

# On Windows with cross-env (cross platform)
"scripts": {
  "watch-files": "lerna watch -- cross-env-shell echo \"Watch file $LERNA_FILE_CHANGES $LERNA_FILE_CHANGE_TYPE in package $LERNA_PACKAGE_NAME\""
}
```

## Options

`lerna watch` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options). Filter flags can be used to select specific packages to watch. See the [examples](#examples) above.

- [`@lerna/watch`](#lernawatch)
  - [Usage](#usage)
  - [Options](#options)
    - [`--emit-changes-delay`](#--emit-changes-delay)
    - [`--file-delimiter`](#--file-delimiter)
    - [`--glob`](#--glob)
    - [`--no-bail`](#--no-bail)
    - [Watch Events](#watch-events) (defaults to file `change` only)
      - [`--watch-all-events`](#--watch-all-events)
      - [`--watch-added-file`](#--watch-added-file)
      - [`--watch-removed-file`](#--watch-removed-file)
      - [`--watch-added-dir`](#--watch-added-dir)
      - [`--watch-removed-dir`](#--watch-removed-dir)
  - [Chokidar Options](#chokidar-options)
    - [`--atomic`](#--atomic)
    - [`--depth`](#--depth)
    - [`--disable-globbing`](#--disable-globbing)
    - [`--follow-symlinks`](#--follow-symlinks)
    - [`--ignored`](#--ignored)
    - [`--ignore-initial`](#--ignore-initial)
    - [`--ignore-permission-errors`](#--ignore-permission-errors)
    - [`--interval`](#--interval)
    - [`--use-polling`](#--use-polling)
    - `awaitWriteFinish` (these options will be prefixed with `awf`)
      - [`--awf-poll-interval`](#--awf-poll-interval)
      - [`--awf-stability-threshold`](#--awf-stability-threshold)

> **Note** to limit the number of files being watched, it is recommended to use either [`--ignored`](#--ignored) and/or [`--glob`](#--glob) options. For example you probably want to avoid watching `node_modules` and `dist` folders.

### `--emit-changes-delay`
Defaults to `100`, time to wait in milliseconds before collecting all file changes and then emitting them into a single watch event. The reason for this option to exist is basically to provide enough time for the lerna watch to collect all prior Chokidar events and merge them into a single watch change event (chokidar has no grouping feature and emits an event for every single file change) and we want to avoid emitting too many events (especially for a watch that triggers a rebuild). This option will come into play when you make a code change that triggers hundred of file changes, you might need to adjust the delay by increasing its value (which is to trigger a large set of changes at the same time, ie variable rename in hundreds of different files).

```sh
$ lerna watch --emit-changes-delay=100 -- <command>
```

### `--file-delimiter`
Defaults to a whitespace, the delimiter that will be used to separate files when mutiple file changes are emitted into a single event emitted by the watch via the $LERNA_FILE_CHANGES variable.

```sh
# use a different delimiter when multiple files are displayed
$ lerna watch --file-delimiter=\";;\" -- <command>
```

### `--glob`

Provide a Glob pattern to target which files to watch, note that this will be appended to the package file path is provided to Chokidar. For example if our package is located under `/home/user/monorepo/packages/pkg-1` and we define `"glob": "/src/**/*.{ts,tsx}"`, then it will use the following watch pattern in Chokidar `/home/user/monorepo/packages/pkg-1/src/**/*.{ts,tsx}`

```sh
# glob pattern will be appended to package path to Chokidar files to watch
$ lerna watch --glob=\"src\**\*.ts" -- <command>
```

### `--no-bail`

```sh
# Run a command, ignoring non-zero (error) exit codes
$ lerna watch --no-bail -- <command>
```

By default, `lerna watch` will exit with an error if _any_ execution returns a non-zero exit code.
Pass `--no-bail` to disable this behavior, executing in _all_ packages regardless of exit code.

### Watch Events
The `lerna watch`, by default, will only execute the watch callback on **file changes only** (via Chokidar `change` event). The reason is simply to have less watches open. If you want to watch for other events, like add/remove file, you can look at the possible flags below or even use `--watch-all-events` for all type of events.

> **Note** When enabling any of these extra watch events above, you might need to know if the file(s) or directory(ies) were added, removed or changed, and for this use case, you can use `$LERNA_FILE_CHANGE_TYPE`. Also note that Chokidar event names to remove a file or directory are `unlink` and `unlinkDir`.

> **Note** an important thing to be aware with Chokidar is that `add`/`addDir` events are also emitted for matching paths while instantiating the watching as chokidar discovers these file paths (before the `ready` event). In other words, when this option is disabled (not recommended) it will fire an event for each file/directory that are discovered when initializing the watch, which why we change the default of [`--ignore-initial`](#--ignore-initial) to be enabled by default to avoid sending a ton of changes.

### `--watch-all-events`

When enabled it will trigger from all possible Chokidar events (`add`, `addDir`, `change`, `unlink`, `unlinkDir`).

```sh
$ lerna watch --watch-all-events -- <command>
```

> **Note** make sure to also take a look at [`--ignored`](#--ignored) and/or [`--glob`](#--glob) options to avoid watching too many files.

### `--watch-added-file`

When enabled it will trigger when a file is being added (in addition to file `change` which is always enabled).

```sh
$ lerna watch --watch-added-file -- <command>
```

### `--watch-added-dir`

When enabled it will trigger when a directory is being added (in addition to file `change` which is always enabled).

```sh
$ lerna watch --watch-added-dir -- <command>
```

### `--watch-removed-file`

When enabled it will trigger when a file is being removed (in addition to file `change` which is always enabled).

```sh
$ lerna watch --watch-removed-file -- <command>
```

### `--watch-removed-dir`

When enabled it will trigger when a directory is being removed (in addition to file `change` which is always enabled).

```sh
$ lerna watch --watch-removed-dir -- <command>
```

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

### `--ignored`

Defines files/paths to be ignored ([anymatch](https://github.com/micromatch/anymatch)-compatible definition).

```sh
# ignore dist folder
$ lerna watch --ignored=\"**/dist\" -- <command>

# or ignore dot file
$ lerna watch --ignored=\"/(^|[/\\])\../\" -- <command>
```

### `--ignore-initial`

Defaults to `true`, if set to false then `add`/`addDir` events are also emitted for matching paths while instantiating the watching as chokidar discovers these file paths (before the `ready` event).

```sh
$ lerna watch --ignore-initial -- <command>
```

> **Note** you typically want this flag enabled when enabling any of [`--watch-added-file`](#--watch-added-file), [`--watch-added-dir`](#--watch-added-dir), [`--watch-removed-file`](#--watch-removed-file) and [`--watch-removed-dir`](#--watch-removed-dir) which is why we enabled this option by default.

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

The `awaitWriteFinish` option can be a complex object, this is however difficult to in the CLI. So in order to make them accessible to the CLI, we prefixed them with "awf", the system will internally replace the option(s) with the appropriate Chokidar complex object. For example, `awfPollInterval: 200` will be transformed to `{ awaitWriteFinish: { pollInterval: 200 }}`

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

Lerna will set 3 separate environment variables when running the inner command. These can be used to customize the command that is run.

- `$LERNA_PACKAGE_NAME` will be replaced with the name of the package that changed.
- `$LERNA_FILE_CHANGES` will be replaced with the file(s) that changed, separated by whitespace when multiple files are changed.
- `$LERNA_FILE_CHANGE_TYPE` will be replaced with the Chokidar event emitted.
   - defaults to file `change` only, other optional events are `add`, `addDir`, `unlink` or `unlinkDir` (when enabled, see [Watch Events](#watch-events))

> **Note** When using these variables in the shell, you will need to escape the `$` with a backslash (`\`). See the examples above.

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

> **Note** When using `npx`, you will need to use `-c` and surround the entire `lerna watch` command in single quotes (`'`). Without this, `npx` will try to replace the watch environment variables before passing the command to `lerna`, resulting in an always empty value for `$LERNA_PACKAGE_NAME` and `$LERNA_FILE_CHANGES`.
