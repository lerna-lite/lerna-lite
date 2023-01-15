[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dy/@lerna-lite/watch?color=forest)](https://www.npmjs.com/package/@lerna-lite/watch)
[![npm](https://img.shields.io/npm/v/@lerna-lite/watch.svg?logo=npm&logoColor=fff)](https://www.npmjs.com/package/@lerna-lite/watch)

# @lerna-lite/watch

## (`lerna watch`) - Watch command [optional] 👓

Watch for changes within packages and execute commands from the root of the repository, for example when TypeScript or SASS files changed.

> **Note** the `watch` idea came from Lerna v6.4.0 but the implementation in Lerna vs Lerna-Lite is entirely different since Lerna is promoting the use of Nx (no surprises here) to watch file changes, while in Lerna-Lite we opted for the use of [`chokidar`](https://github.com/paulmillr/chokidar) to watch for files. Chokidar is used by millions of packages (TypeScript, SASS, ... even VSCode uses it), so chances are that you already have it installed directly or indirectly. Most of Chokidar [options](https://github.com/paulmillr/chokidar#api) are available with `lerna watch`, see the options below.

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

> 💡 When using `$LERNA_PACKAGE_NAME` and `LERNA_WATCH_CHANGE_FILE` in the shell, you will need to escape the dollar sign with a backslash (`\`). See the [examples](#examples) below.

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

When using `npx`, the `-c` option must be used if also providing variables for substitution:

```sh
$ npx -c 'lerna watch -- echo \$LERNA_PACKAGE_NAME \LERNA_WATCH_CHANGE_FILE'
```

When adding an npm script on Windows platform, environment variables need to be wrapped in `%` symbol, on the other hand Unix variable must be wrapped in `${...}`

On Windows
```sh
"scripts": {
  "watch-files": "lerna watch -- echo Watch file %LERNA_WATCH_CHANGE_FILE% %LERNA_WATCH_CHANGE_TYPE% in package %LERNA_PACKAGE_NAME%"
}
```

On Linux/Mac
```sh
"scripts": {
  "watch-files": "lerna watch -- echo Watch file ${LERNA_WATCH_CHANGE_FILE} ${LERNA_WATCH_CHANGE_TYPE} in package ${LERNA_PACKAGE_NAME}"
}
```

## Options

`lerna watch` accepts all [filter flags](https://www.npmjs.com/package/@lerna/filter-options). Filter flags can be used to select specific packages to watch. See the [examples](#examples) above.

### `--verbose`

Run `lerna watch` in verbose mode, where commands are logged before execution.